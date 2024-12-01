const TAG = "page_myfatoorah_payment_inspector";
const { MYFATOORAH_COUNTRIES, MYFATOORAH_LANGUAGES } = require('../integrations/my_fatoorah');
exports.page_myfatoorah_payment_inspector = async (req, res, next) => {
    try {

        return res.render("page_myfatoorah_payment_inspector", {
            layout: "./inc_layout",
            data: {
                countries: MYFATOORAH_COUNTRIES,
                languages: MYFATOORAH_LANGUAGES
            },
        });
    } catch (error) {
        console.log(TAG, error.message);
        return res.status(500).json({ message: "server error" });
    }
}