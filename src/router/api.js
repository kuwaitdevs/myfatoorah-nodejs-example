const express = require("express");

const { myfatoorah_payment_execute } = require("../controllers/myfatoorah_payment_execute");
const { myfatoorah_payment_initiate } = require("../controllers/myfatoorah_payment_initiate");
const { myfatoorah_payment_status } = require("../controllers/myfatoorah_payment_status");
const { myfatoorah_payment_send } = require("../controllers/myfatoorah_payment_send");
const { myfatoorah_payment_details } = require("../controllers/myfatoorah_payment_details");

const router = express.Router();

router.post("/myfatoorah/payment/execute", myfatoorah_payment_execute);
router.post("/myfatoorah/payment/send", myfatoorah_payment_send);

router.post("/myfatoorah/payment/init", myfatoorah_payment_initiate);
router.put("/myfatoorah/payment/status", myfatoorah_payment_status);

router.get("/myfatoorah/payment/details", myfatoorah_payment_details);


module.exports = router;