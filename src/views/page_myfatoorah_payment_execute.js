const TAG = "page_myfatoorah_payment_execute";
const { MYFATOORAH_COUNTRIES, MYFATOORAH_LANGUAGES } = require('../integrations/my_fatoorah');
exports.page_myfatoorah_payment_execute = async (req, res, _next) => {
    try {
        return res.render("page_myfatoorah_payment_execute", {
            layout: "./inc_layout",
            data: {
                countries: MYFATOORAH_COUNTRIES,
                languages: MYFATOORAH_LANGUAGES
            }
        });
    } catch (error) {
        console.log(TAG, error.message);
        return res.status(500).json({ message: "server error" });
    }
};
