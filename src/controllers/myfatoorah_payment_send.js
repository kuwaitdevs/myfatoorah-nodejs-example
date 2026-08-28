const TAG = "myfatoorah_payment_send";
const { sendPayment, getPaymentStatus } = require('../integrations/my_fatoorah');
const { sanitizeInvoiceItems, validateCheckout } = require('../util/payment_validation');
const { JsonDB, Config } = require('node-json-db');
const db = new JsonDB(new Config("localdb", true, false, '/'));

exports.myfatoorah_payment_send = async (req, res, next) => {
    try {
        const { body } = req;
        const {
            customerName,
            customerMobile, customerEmail,
            invoiceItems, invoiceValue,
            customerReference, countryId,
            language,
            userDefinedField
        } = body;

        const errors = validateCheckout(body);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors.join(', ') });
        }

        const gatewayExecuteRequest = {
            invoiceValue: Number(invoiceValue),
            countryId,
            notificationOption: 'ALL'
        };

        const optional = {};

        if (customerName) {
            optional.CustomerName = customerName;
        }

        if (customerMobile) {
            optional.CustomerMobile = customerMobile;
        }

        const callbackRoot = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
        if (callbackRoot) {
            optional.CallBackUrl = `${callbackRoot}/myfatoorah/callback/success`;
            optional.ErrorUrl = `${callbackRoot}/myfatoorah/callback/error`;
        }

        if (customerEmail) {
            optional.CustomerEmail = customerEmail;
        }

        if (language) {
            optional.Language = language;
        }

        if (invoiceItems) {
            optional.InvoiceItems = sanitizeInvoiceItems(invoiceItems);
        }

        if (userDefinedField) {
            optional.UserDefinedField = userDefinedField;
        }

        if (customerReference) {
            optional.CustomerReference = customerReference;
        }

        if (Object.keys(optional).length > 0)
            gatewayExecuteRequest.optional = optional;

        const myFatoorahResponse = await sendPayment(gatewayExecuteRequest);
        const myFatoorahBody = await myFatoorahResponse.json();

        if (!myFatoorahResponse.ok) {
            console.log(TAG, 'myfatoorah payment error', myFatoorahResponse.status, myFatoorahBody.Message);
            return res.status(400).json({ message: 'Failed to create payment' });
        }

        if (!myFatoorahBody.IsSuccess) {
            console.log(TAG, 'myfatoorah payment error', myFatoorahResponse.status, myFatoorahBody.Message);
            return res.status(400).json({ message: 'Failed to create payment' });
        }

        const invoiceId = myFatoorahBody.Data.InvoiceId;
        const pmtLink = myFatoorahBody.Data.InvoiceURL;

        const pmtRes = await getPaymentStatus({ key: invoiceId, keyType: 'InvoiceId' });
        const pmtBody = await pmtRes.json();

        await db.push(`/myfatoorah/payments/${invoiceId}`, {
            createdAt: new Date(),
            type: "link",
            request: {
                CustomerReference: myFatoorahBody.Data.CustomerReference,
                InvoiceId: myFatoorahBody.Data.InvoiceId,
                InvoiceURL: myFatoorahBody.Data.InvoiceURL,
                UserDefinedField: myFatoorahBody.Data.UserDefinedField
            },
            response: pmtBody.Data
        });

        return res.status(200).json({
            message: 'Payment link created',
            data: {
                pmtLink
            }
        });

    } catch (error) {
        console.log(TAG, "error", error);
        return res.status(500).json({});
    }
}