const TAG = "page_myfatoorah_payment_list";
const { JsonDB, Config } = require('node-json-db');
const db = new JsonDB(new Config("localdb", true, false, '/'));

exports.page_myfatoorah_payment_list = async (req, res, next) => {
    try {

        let paymentsList = [];

        try {
            const payments = await db.getData("/myfatoorah/payments");
            const pmtIds = Object.keys(payments);
            pmtIds.forEach((id, i) => {
                paymentsList.push({
                    no: i + 1,
                    id, ...payments[id]
                });
            });
        } catch (error) {
            console.log(TAG, "No payments found in the database.");
        }

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