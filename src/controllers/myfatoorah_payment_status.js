const TAG = "myfatoorah_payment_status";
const { getPaymentStatus } = require('../integrations/my_fatoorah');
const { normalizePaymentStatus, validateStatusKey } = require('../util/payment_validation');
const { JsonDB, Config } = require('node-json-db');
const db = new JsonDB(new Config("localdb", true, false, '/'));

async function refreshPaymentStatus({ key, keyType }) {
    const errors = validateStatusKey(key, keyType);
    if (errors.length > 0) {
        const error = new Error(errors.join(', '));
        error.statusCode = 400;
        throw error;
    }

    const response = await getPaymentStatus({ key, keyType });
    const body = await response.json();
    if (!response.ok || !body.IsSuccess || !body.Data) {
        const error = new Error(body.Message || 'Error retrieving payment data');
        error.statusCode = response.status >= 400 ? response.status : 400;
        throw error;
    }

    const invoice = body.Data;
    const invoiceId = String(invoice.InvoiceId);
    let payment;
    try {
        payment = await db.getData(`/myfatoorah/payments/${invoiceId}`);
    } catch (_error) {
        const error = new Error('No local order matches this MyFatoorah invoice');
        error.statusCode = 404;
        throw error;
    }

    const normalizedStatus = normalizePaymentStatus(invoice);
    payment.response = invoice;
    if (keyType === 'PaymentId') payment.PaymentId = String(key);

    if (normalizedStatus === 'Success' && !payment.action?.executed) {
        payment.action = {
            ...payment.action,
            executed: true,
            executedDate: new Date()
        };
        // Fulfill the order here. Keep this block idempotent.
    }

    await db.push(`/myfatoorah/payments/${invoiceId}`, payment, true);

    return {
        message: normalizedStatus === 'Success'
            ? 'Payment verified successfully'
            : `Payment status: ${normalizedStatus}`,
        captured: normalizedStatus === 'Success',
        invoiceItems: [
            { label: 'Payment Status', value: normalizedStatus },
            { label: 'Invoice ID', value: invoice.InvoiceId },
            { label: 'Reference ID', value: invoice.InvoiceReference || invoice.CustomerReference || '' },
            { label: 'Amount', value: invoice.InvoiceDisplayValue || invoice.InvoiceValue },
            { label: 'Payment Date', value: invoice.CreatedDate }
        ]
    };
}

exports.refreshPaymentStatus = refreshPaymentStatus;

exports.myfatoorah_payment_status = async (req, res) => {
    try {
        const data = await refreshPaymentStatus(req.body);
        return res.status(200).json({ data });
    } catch (error) {
        console.log(TAG, 'error', error.message);
        return res.status(error.statusCode || 500).json({
            data: {
                message: error.message,
                captured: false,
                invoiceItems: []
            }
        });
    }
};
