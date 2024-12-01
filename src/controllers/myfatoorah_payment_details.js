const TAG = "myfatoorah_payment_details";
const { getPaymentStatus } = require('../integrations/my_fatoorah');

exports.myfatoorah_payment_details = async (req, res, next) => {
    try {
        const { query } = req;
        const { key, keyType } = query;

        if (!key || !keyType) {
            return res.status(400).json({ message: 'invalid data' });
        }

        console.log('payment status request key', key, ' keyType', keyType);

        const pmtRes = await getPaymentStatus({ key, keyType });

        if (!pmtRes.ok) {
            return res.status(400).json({ message: 'error getting payment details' });
        }

        const pmtBody = await pmtRes.json();

        return res.status(200).json({
            data: pmtBody
        });
    } catch (error) {
        console.log(TAG, "error", error.message);
        return res.status(500).json({ message: 'server error' });
    }
}