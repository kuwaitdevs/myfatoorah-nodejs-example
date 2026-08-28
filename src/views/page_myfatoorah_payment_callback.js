const TAG = "page_myfatoorah_payment_callback";
const { detectPaymentKeyType } = require('../integrations/my_fatoorah');
const { refreshPaymentStatus } = require('../controllers/myfatoorah_payment_status');

exports.page_myfatoorah_payment_callback = async (req, res, next) => {
    try {
        const { query, params } = req;
        const { type } = params;
        const { paymentId } = query;

        if (!paymentId || (type !== "success" && type !== "error")) {
            console.log(TAG, "error in myfatoorah response paymentId", paymentId, ' type', type);
            return res.render("page_myfatoorah_payment_callback", {
                layout: "./inc_layout",
                data: {
                    ok: false,
                    message: "error in myfatoorah response",
                    type: "",
                    paymentId
                },
            });
        }

        const result = await refreshPaymentStatus({
            key: paymentId,
            keyType: detectPaymentKeyType(paymentId)
        });

        return res.render("page_myfatoorah_payment_callback", {
            layout: "./inc_layout",
            data: {
                ok: true,
                message: result.message,
                type,
                paymentId,
                ...result
            },
        });
    } catch (error) {
        console.log(TAG, error.message);
        return res.status(error.statusCode || 500).render("page_myfatoorah_payment_callback", {
            layout: "./inc_layout",
            data: {
                ok: false,
                message: error.message || "Error verifying payment",
                type: "",
                paymentId: req.query.paymentId || '',
                captured: false,
                invoiceItems: []
            }
        });
    }
}