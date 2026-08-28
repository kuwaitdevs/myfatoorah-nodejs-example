/*
* Requires MYFATOORAH_TOKEN_DEV in development and MYFATOORAH_TOKEN_PROD in production.
*/

const TAG = 'my_fatoorah';

const MYFATOORAH_DEV_API_URL = 'https://apitest.myfatoorah.com';
const MYFATOORAH_PROD_API_URL = 'https://api.myfatoorah.com';

const MYFATOORAH_NOTIFICATION_OPTION = [
    {
        label: "Email",
        id: 'EML'
    },
    {
        label: "SMS",
        id: 'SMS',
    },
    {
        label: "Link",
        id: 'LNK',
    },
    {
        label: "All",
        id: 'ALL',
    },
];

const MYFATOORAH_LANGUAGES = [
    {
        label: "English",
        id: 'EN'
    },
    {
        label: "Arabic",
        id: 'AR',
    },
];

const MYFATOORAH_COUNTRIES = [
    {
        label: "Kuwait",
        id: 'KWT',
        phoneCode: '+965',
        currency: 'KWD'
    },
    {
        label: "Saudi",
        id: 'SAU',
        phoneCode: '+966',
        currency: 'SAR'
    },
    {
        label: "Bahrain",
        id: 'BHR',
        phoneCode: '+973',
        currency: 'BHD'
    },
    {
        label: "UAE",
        id: 'ARE',
        phoneCode: '+971',
        currency: 'AED'
    },
    {
        label: "Qatar",
        id: 'QAT',
        phoneCode: '+974',
        currency: 'QAR'
    },
    {
        label: "Oman",
        id: 'OMN',
        phoneCode: '+968',
        currency: 'OMR'
    },
    {
        label: "Jordan",
        id: 'JOD',
        phoneCode: '+962',
        currency: 'JOD'
    },
    {
        label: "Egypt",
        id: 'EGY',
        phoneCode: '+20',
        currency: 'EGP'
    }
];

exports.MYFATOORAH_COUNTRIES = MYFATOORAH_COUNTRIES;
exports.MYFATOORAH_LANGUAGES = MYFATOORAH_LANGUAGES;
exports.MYFATOORAH_NOTIFICATION_OPTION = MYFATOORAH_NOTIFICATION_OPTION;


const getMyFatoorahApiBaseURL = () => {
    if (process.env.MYFATOORAH_API_BASE_URL) {
        return process.env.MYFATOORAH_API_BASE_URL.replace(/\/$/, '');
    }
    return process.env.NODE_ENV === 'production' ? MYFATOORAH_PROD_API_URL : MYFATOORAH_DEV_API_URL;
}

const getToken = () => {
    const token = process.env.NODE_ENV === 'production'
        ? process.env.MYFATOORAH_TOKEN_PROD || process.env.MYFATOORAH_TOKEN
        : process.env.MYFATOORAH_TOKEN_DEV || process.env.MYFATOORAH_TOKEN;

    if (!token) {
        throw new Error('Missing MyFatoorah API token for the current environment');
    }
    return token;
}

const getCountry = (countryId) => {
    const country = MYFATOORAH_COUNTRIES.find((item) => item.id === countryId);
    if (!country) throw new Error(`Unsupported country: ${countryId}`);
    return country;
};

const detectPaymentKeyType = (key) => /^\d{15,}$/.test(String(key)) ? 'PaymentId' : 'InvoiceId';
exports.detectPaymentKeyType = detectPaymentKeyType;

/**
 * https://apitest.myfatoorah.com/swagger/ui/index#!/Payment/Payment_InitiatePayment
 * https://docs.myfatoorah.com/docs/initiate-payment
 * @param countryId String
 * @param invoiceAmount Number
 */
exports.initiatePayment = async ({ countryId, invoiceAmount }) => {
    const url = `${getMyFatoorahApiBaseURL()}/v2/InitiatePayment`;
    const country = getCountry(countryId);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getToken()}`);
    headers.append("Accept", 'application/json');

    const bodyRequestRaw = JSON.stringify({
        InvoiceAmount: invoiceAmount,
        CurrencyIso: country.currency
    });

    const requestOptions = {
        method: "POST",
        headers: headers,
        body: bodyRequestRaw,
        credentials: "include",
    };

    return fetch(url, requestOptions);
}

/**
 * https://apitest.myfatoorah.com/swagger/ui/index#!/Payment/Payment_ExecutePayment
 * https://docs.myfatoorah.com/docs/execute-payment
 * create a MyFatoorah invoice against a certain gateway return Invoice details
 * @param invoiceValue Number - amount to charge
 * @param paymentMethodId Number - ID for payment gateway
 * @param countryId String
 * @param optional.CustomerName
 * @param optional.CallBackUrl
 * @param optional.ErrorUrl
 * @param optional.CustomerMobile
 * @param optional.CustomerEmail
 * @param optional.Language EN | AR
 * @param optional.CustomerReference
 * @param optional.CustomerCivilId
 * @param optional.UserDefinedField
 * @param optional.CustomerAdress
 * @param optional.ExpiryDate
 * @param optional.InvoiceItems
 * @param optional.ShippingMethod
 * @param optional.ShippingConsignee
 * @param optional.Suppliers	
 * @param optional.RecurringModel
 * @param optional.ProcessingDetails
 */
exports.executePayment = async ({
    invoiceValue,
    paymentMethodId,
    countryId,
    optional
}) => {
    let url = `${getMyFatoorahApiBaseURL()}/v2/ExecutePayment`;
    const country = getCountry(countryId);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getToken()}`);
    headers.append("Accept", 'application/json');

    let bodyRequest = {
        PaymentMethodId: paymentMethodId,
        DisplayCurrencyIso: country.currency,
        MobileCountryCode: country.phoneCode,
        InvoiceValue: invoiceValue,
    };

    if (optional) {
        bodyRequest = { ...bodyRequest, ...optional };
    }

    const bodyRequestRaw = JSON.stringify(bodyRequest);

    const requestOptions = {
        method: "POST",
        headers: headers,
        body: bodyRequestRaw,
        credentials: "include",
    };

    return fetch(url, requestOptions);
}

/**
 * https://docs.myfatoorah.com/docs/send-payment
 * https://apitest.myfatoorah.com/swagger/ui/index#!/Payment/Payment_SendPayment
 * generate an invoice link that can be sent by any channel we support
 * @param invoiceValue
 * @param customerName
 * @param notificationOption EML | SMS | LNK | ALL
 * @param optional.CustomerMobile Optional - Required for notificationOption: SMS | ALL
 * @param optional.CustomerEmail Optional - Required for notificationOption: EML | ALL
 * @param optional.DisplayCurrencyIso Optional -
 * @param optional.CallBackUrl Optional -
 * @param optional.ErrorUrl Optional -
 * @param optional.Language Optional -
 * @param optional.CustomerReference Optional -
 * @param optional.CustomerCivilId Optional -
 * @param optional.UserDefinedField Optional -
 * @param optional.CustomerAddress Optional -
 * @param optional.ExpiryDate Optional -
 * @param optional.InvoiceItems Optional -
 * @param optional.ShippingMethod Optional -
 * @param optional.ShippingConsignee Optional -
 * @param optional.Suppliers Optional -
 */
exports.sendPayment = async ({
    invoiceValue,
    customerName,
    notificationOption,
    countryId,
    optional
}
) => {

    let url = `${getMyFatoorahApiBaseURL()}/v2/SendPayment`;
    const country = getCountry(countryId);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getToken()}`);
    headers.append("Accept", 'application/json');

    let bodyRequest = {
        NotificationOption: notificationOption,
        CustomerName: customerName,
        InvoiceValue: invoiceValue,
        DisplayCurrencyIso: country.currency,
        MobileCountryCode: country.phoneCode,
    };

    if (optional) {
        bodyRequest = { ...bodyRequest, ...optional };
    }

    const bodyRequestRaw = JSON.stringify(bodyRequest);

    const requestOptions = {
        method: "POST",
        headers: headers,
        body: bodyRequestRaw,
        credentials: "include",
    };

    return fetch(url, requestOptions);
}




/**
 * https://apitest.myfatoorah.com/swagger/ui/index#!/Payment/Payment_GetPaymentStatus
 * https://docs.myfatoorah.com/docs/get-payment-status
 * @param key String
 * @param keyType InvoiceId | PaymentId | CustomerReference
 */
exports.getPaymentStatus = async ({ key, keyType = detectPaymentKeyType(key) }) => {
    let url = `${getMyFatoorahApiBaseURL()}/v2/GetPaymentStatus`;

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getToken()}`);
    headers.append("Accept", 'application/json');

    const bodyRequestRaw = JSON.stringify({
        Key: key,
        KeyType: keyType
    });
    const requestOptions = {
        method: "POST",
        headers: headers,
        body: bodyRequestRaw,
        credentials: "include",
    };

    return fetch(url, requestOptions);
}


/**
 * https://apitest.myfatoorah.com/swagger/ui/index#!/Refund/Refund_MakeRefund
 * https://docs.myfatoorah.com/docs/make-refund
 * @param key String
 * @param keyType String: InvoiceId | PaymentId | CustomerReference
 * @param serviceChargeOnCustomer Boolean
 * @param amount Number
 * @param comment String
 * @param optional.amountDeductedFromSupplier Number
 */
exports.makeRefund = async ({ refundRequest }) => {
    const url = `${getMyFatoorahApiBaseURL()}/v2/MakeRefund`;

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getToken()}`);
    headers.append("Accept", 'application/json');

    const bodyRequestRaw = JSON.stringify(refundRequest);

    const requestOptions = {
        method: "POST",
        headers: headers,
        body: bodyRequestRaw,
        credentials: "include",
    };

    return fetch(url, requestOptions);
}

/**
 * https://apitest.myfatoorah.com/swagger/ui/index#!/Refund/Refund_GetRefundStatus
 * https://docs.myfatoorah.com/docs/getrefundstatus
 * @param key Value of the key type
 * @param keyType "InvoiceId" | "RefundReference" | "RefundId"
 */
exports.getRefundStatus = async ({ key, keyType }) => {
    const url = `${getMyFatoorahApiBaseURL()}/v2/GetRefundStatus`;

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${getToken()}`);
    headers.append("Accept", 'application/json');

    const bodyRequestRaw = JSON.stringify({
        Key: key,
        KeyType: keyType
    });

    const requestOptions = {
        method: "POST",
        headers: headers,
        body: bodyRequestRaw,
        credentials: "include",
    };

    return fetch(url, requestOptions);
}

/*
"InvoiceItems":
[
    {
        "ItemName": "string",
        "Quantity": 0,
        "UnitPrice": 0,
        "Weight": 0,
        "Width": 0,
        "Height": 0,
        "Depth": 0
    }
]
*/

/*
"CustomerAddress": {
    "Block": "string",
    "Street": "string",
    "HouseBuildingNo": "string",
    "AddressInstructions": "string"
},
*/

/*
"ShippingConsignee": {
    "PersonName": "string",
    "Mobile": "string",
    "EmailAddress": "string",
    "LineAddress": "string",
    "CityName": "string",
    "PostalCode": "string",
    "CountryCode": "string"
},
*/