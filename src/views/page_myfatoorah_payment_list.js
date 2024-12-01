const TAG = "page_myfatoorah_payment_list";
const { JsonDB, Config } = require('node-json-db');
const db = new JsonDB(new Config("localdb", true, false, '/'));

exports.page_myfatoorah_payment_list = async (req, res, next) => {
    try {

        const payments = await db.getData("/myfatoorah/payments");

        const pmtIds = Object.keys(payments);

        const paymentsList = [];

        pmtIds.forEach((id, i) => {
            paymentsList.push({
                no: i + 1,
                id, ...payments[id]
            });
        });

        console.log(paymentsList);

        return res.render("page_myfatoorah_payment_list", {
            layout: "./inc_layout",
            data: {
                paymentsList
            },
        });
    } catch (error) {
        console.log(TAG, error.message);
        return res.status(500).json({ message: "server error" });
    }
}