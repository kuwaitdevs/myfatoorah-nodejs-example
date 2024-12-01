const express = require("express");

const { page_myfatoorah_payment_execute } = require("../views/page_myfatoorah_payment_execute");
const { page_myfatoorah_payment_callback } = require("../views/page_myfatoorah_payment_callback");
const { page_myfatoorah_payment_list } = require("../views/page_myfatoorah_payment_list");
const { page_myfatoorah_payment_inspector } = require("../views/page_myfatoorah_payment_inspector");

const { page_index } = require("../views/page_index");

const router = express.Router();

router.get("/", page_index);

router.get("/myfatoorah/payment/execute", page_myfatoorah_payment_execute);

router.get("/myfatoorah/callback/:type", page_myfatoorah_payment_callback);

router.get("/myfatoorah/payment/list", page_myfatoorah_payment_list);

router.get("/myfatoorah/payment/inspect", page_myfatoorah_payment_inspector);



module.exports = router;