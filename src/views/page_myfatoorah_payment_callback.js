const TAG = "page_myfatoorah_payment_callback";

exports.page_myfatoorah_payment_callback = async (req, res, next) => {
    try {
        const { query, params } = req;
        const { type } = params;
        const { paymentId, Id } = query;

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

        return res.render("page_myfatoorah_payment_callback", {
            layout: "./inc_layout",
            data: {
                ok: true,
                message: "",
                type,
                paymentId
            },
        });
    } catch (error) {
        console.log(TAG, error.message);
        return res.status(500).json({ message: "server error" });
    }
}