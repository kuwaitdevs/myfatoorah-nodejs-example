const TAG = "myfatoorah_payment_initiate";
const { initiatePayment } = require('../integrations/my_fatoorah');

exports.myfatoorah_payment_initiate = async (req, res, next) => {
    try {
        const { body } = req;
        const { countryId, invoiceAmount } = body;

        if (!invoiceAmount || !countryId) {
            return res.status(400).json({ message: 'invalid data' });
        }

        console.log('user initiated pmt', invoiceAmount, countryId);

        const pmtRes = await initiatePayment({ countryId, invoiceAmount });

        if (!pmtRes.ok) {
            return res.status(400).json({ message: 'error getting payment details' });
        }

        const bod = await pmtRes.json();

        return res.status(200).json({ data: bod.Data.PaymentMethods });

    } catch (error) {
        console.log(TAG, "error", error.message);
        return res.status(500).json({});
    }
}