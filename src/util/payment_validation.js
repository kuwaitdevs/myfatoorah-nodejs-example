const VALID_COUNTRIES = new Set(['KWT', 'SAU', 'BHR', 'ARE', 'QAT', 'OMN', 'JOD', 'EGY']);
const VALID_LANGUAGES = new Set(['EN', 'AR']);
const VALID_KEY_TYPES = new Set(['InvoiceId', 'PaymentId', 'CustomerReference']);

function validateAmount(value, fieldName = 'invoiceValue') {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        return `${fieldName} must be a positive number`;
    }
    return null;
}

function validateInvoiceItems(items, expectedTotal) {
    if (!Array.isArray(items) || items.length === 0) {
        return ['invoiceItems must contain at least one item'];
    }

    const errors = [];
    let calculatedTotal = 0;
    items.forEach((item, index) => {
        const quantity = Number(item && item.Quantity);
        const unitPrice = Number(item && item.UnitPrice);
        if (!item || typeof item.ItemName !== 'string' || !item.ItemName.trim()) {
            errors.push(`invoiceItems[${index}].ItemName is required`);
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            errors.push(`invoiceItems[${index}].Quantity must be positive`);
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            errors.push(`invoiceItems[${index}].UnitPrice must not be negative`);
        }
        if (Number.isFinite(quantity) && Number.isFinite(unitPrice)) {
            calculatedTotal += quantity * unitPrice;
        }
    });

    if (errors.length === 0 && Math.abs(calculatedTotal - Number(expectedTotal)) > 0.001) {
        errors.push('invoiceValue must equal the server-calculated invoice item total');
    }
    return errors;
}

function validateCheckout(body, { requirePaymentMethod = false } = {}) {
    const errors = [];
    const amountError = validateAmount(body.invoiceValue);
    if (amountError) errors.push(amountError);
    if (!VALID_COUNTRIES.has(body.countryId)) errors.push('countryId is unsupported');
    if (body.language && !VALID_LANGUAGES.has(body.language)) errors.push('language must be EN or AR');
    if (requirePaymentMethod && (!Number.isInteger(Number(body.paymentMethodId)) || Number(body.paymentMethodId) <= 0)) {
        errors.push('paymentMethodId must be a positive integer');
    }
    if (body.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail)) {
        errors.push('customerEmail is invalid');
    }
    if (body.invoiceItems !== undefined) {
        errors.push(...validateInvoiceItems(body.invoiceItems, body.invoiceValue));
    }
    return errors;
}

function validateStatusKey(key, keyType) {
    const errors = [];
    if (key === undefined || key === null || String(key).trim() === '') errors.push('key is required');
    if (!VALID_KEY_TYPES.has(keyType)) errors.push('keyType is invalid');
    return errors;
}

function normalizePaymentStatus(invoiceData) {
    const transactions = Array.isArray(invoiceData && invoiceData.InvoiceTransactions)
        ? invoiceData.InvoiceTransactions
        : [];
    const latest = transactions[transactions.length - 1];
    const rawStatus = latest && latest.TransactionStatus
        ? latest.TransactionStatus
        : invoiceData && invoiceData.InvoiceStatus;

    if (rawStatus === 'Succss' || rawStatus === 'SUCCESS' || rawStatus === 'Paid') return 'Success';
    if (rawStatus === 'Failed') return 'Failed';
    if (rawStatus === 'Canceled') return 'Canceled';
    return rawStatus || 'Unknown';
}

function sanitizeInvoiceItems(items) {
    if (!Array.isArray(items)) return undefined;
    return items.map((item) => ({
        ItemName: item.ItemName.trim(),
        Quantity: Number(item.Quantity),
        UnitPrice: Number(item.UnitPrice)
    }));
}

module.exports = {
    normalizePaymentStatus,
    sanitizeInvoiceItems,
    validateAmount,
    validateCheckout,
    validateStatusKey,
};
