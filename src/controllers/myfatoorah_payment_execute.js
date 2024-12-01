const TAG = "myfatoorah_payment_execute";
const { executePayment, getPaymentStatus } = require('../integrations/my_fatoorah');
const { JsonDB, Config } = require('node-json-db');
const db = new JsonDB(new Config("localdb", true, false, '/'));

exports.myfatoorah_payment_execute = async (req, res, next) => {
    try {
        const { body } = req;
        const {
            paymentMethodId, customerName,
            customerMobile, customerEmail,
            invoiceItems, invoiceValue,
            customerReference, countryId,
            language, callBackUrl, errorUrl,
            userDefinedField
        } = body;

        const gatewayExecuteRequest = {
            invoiceValue,
            paymentMethodId,
            countryId
        };

        const optional = {};

        if (customerName) {
            optional.CustomerName = customerName;
        }

        if (customerMobile) {
            optional.CustomerMobile = customerMobile;
        }

        if (callBackUrl) {
            optional.CallBackUrl = callBackUrl;
        }

        if (errorUrl) {
            optional.ErrorUrl = errorUrl;
        }

        if (customerEmail) {
            optional.CustomerEmail = customerEmail;
        }

        if (language) {
            optional.Language = language;
        }

        if (invoiceItems) {
            optional.InvoiceItems = invoiceItems;
        }

        if (userDefinedField) {
            optional.UserDefinedField = userDefinedField;
        }

        if (customerReference) {
            optional.CustomerReference = customerReference;
        }

        if (Object.keys(optional).length > 0)
            gatewayExecuteRequest.optional = optional;

        const myFatoorahResponse = await executePayment(gatewayExecuteRequest);
        const myFatoorahBody = await myFatoorahResponse.json();

        if (!myFatoorahResponse.ok) {
            console.log(TAG, 'myfatoorah payment error', user.id, myFatoorahResponse.status, myFatoorahBody.Message);
            return res.status(400).json({ message: 'Failed to create payment' });
        }

        if (!myFatoorahBody.IsSuccess) {
            console.log(TAG, 'myfatoorah payment error', user.id, myFatoorahResponse.status, myFatoorahBody.Message);
            return res.status(400).json({ message: 'Failed to create payment' });
        }

        const invoiceId = myFatoorahBody.Data.InvoiceId;
        const pmtLink = myFatoorahBody.Data.PaymentURL;

        const pmtRes = await getPaymentStatus({ key: invoiceId, keyType: 'InvoiceId' });
        const pmtBody = await pmtRes.json();

        await db.push(`/myfatoorah/payments/${invoiceId}`, {
            createdAt: new Date(),
            type: "exec",
            request: {
                CustomerReference: myFatoorahBody.Data.CustomerReference,
                InvoiceId: myFatoorahBody.Data.InvoiceId,
                IsDirectPayment: myFatoorahBody.Data.IsDirectPayment,
                PaymentURL: myFatoorahBody.Data.PaymentURL,
                RecurringId: myFatoorahBody.Data.RecurringId,
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
        console.log(TAG, "error", error.message);
        return res.status(500).json({});
    }
}