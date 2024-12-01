const TAG = "myfatoorah_payment_status";
const { getPaymentStatus } = require('../integrations/my_fatoorah');
const { JsonDB, Config } = require('node-json-db');
const db = new JsonDB(new Config("localdb", true, false, '/'));


exports.myfatoorah_payment_status = async (req, res, next) => {
    try {
        const { body } = req;
        const { key, keyType } = body;

        if (!key || !keyType) {
            return res.status(400).json({ message: 'invalid data' });
        }

        console.log('payment status request key', key, ' keyType', keyType);

        const pmtRes = await getPaymentStatus({ key, keyType });

        if (!pmtRes.ok) {
            return res.status(400).json({ message: 'error getting payment details' });
        }

        const pmtBody = await pmtRes.json();

        if (pmtBody.IsSuccess) {
            const invoiceId = pmtBody.Data.InvoiceId;
            const pmt = await db.getData(`/myfatoorah/payments/${invoiceId}`);

            if (!pmt) {
                return res.status(400).json({ message: 'error getting payment details' });
            }

            // Store in DB
            pmt.response = pmtBody.Data;
            // update payment id for reference
            pmt.PaymentId = key;

            if (pmtBody.Data.InvoiceStatus === 'Paid') {

                // check if payment action performed previously
                if (!pmt.action?.executed) {
                    // execute action related to payment
                    if (!pmt.action) {
                        pmt.action = {};
                    }
                    // perform payment action if needed
                    pmt.action.executed = true;
                    pmt.action.executedDate = new Date();
                    // send an email to customer
                }
            }

            await db.push(`/myfatoorah/payments/${invoiceId}`, pmt, true);

            const invoiceItems = [
                {
                    label: "Payment Status",
                    value: pmtBody.Data.InvoiceStatus,
                },
                {
                    label: "Invoice ID",
                    value: pmtBody.Data.InvoiceId
                },
                {
                    label: "Reference ID",
                    value: pmtBody.Data.InvoiceReference
                },
                {
                    label: "Amount",
                    value: pmtBody.Data.InvoiceDisplayValue
                },
                {
                    label: "Payment Date",
                    value: pmtBody.Data.CreatedDate
                }
            ];

            return res.status(200).json({
                data: {
                    message: 'Payment Successful, Thank you!',
                    captured: pmtBody.Data.InvoiceStatus === 'Paid',
                    invoiceItems
                }
            });
        }

        return res.status(400).json({
            data: {
                message: 'Error retrieving payment data',
                captured: false,
                invoiceItems: []
            }
        });

    } catch (error) {
        console.log(TAG, "error", error.message);
        return res.status(500).json({ message: 'server error' });
    }
}