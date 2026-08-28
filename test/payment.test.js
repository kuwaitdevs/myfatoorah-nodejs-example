const test = require('node:test');
const assert = require('node:assert/strict');

const { detectPaymentKeyType } = require('../src/integrations/my_fatoorah');
const {
    normalizePaymentStatus,
    sanitizeInvoiceItems,
    validateCheckout,
    validateStatusKey,
} = require('../src/util/payment_validation');

test('detects gateway PaymentId and internal InvoiceId values', () => {
    assert.equal(detectPaymentKeyType('100623910000003739'), 'PaymentId');
    assert.equal(detectPaymentKeyType('7110445'), 'InvoiceId');
});

test('normalizes successful MyFatoorah status spellings', () => {
    assert.equal(normalizePaymentStatus({ InvoiceStatus: 'Paid' }), 'Success');
    assert.equal(normalizePaymentStatus({
        InvoiceStatus: 'Pending',
        InvoiceTransactions: [{ TransactionStatus: 'Succss' }]
    }), 'Success');
});

test('uses latest transaction status for canceled or failed attempts', () => {
    assert.equal(normalizePaymentStatus({
        InvoiceStatus: 'Pending',
        InvoiceTransactions: [{ TransactionStatus: 'Failed' }]
    }), 'Failed');
});

test('validates and recalculates invoice item totals', () => {
    const valid = {
        invoiceValue: 10,
        countryId: 'KWT',
        paymentMethodId: 1,
        language: 'EN',
        customerEmail: 'buyer@example.com',
        invoiceItems: [{ ItemName: 'Product', Quantity: 2, UnitPrice: 5 }]
    };
    assert.deepEqual(validateCheckout(valid, { requirePaymentMethod: true }), []);

    const manipulated = { ...valid, invoiceValue: 1 };
    assert.match(validateCheckout(manipulated, { requirePaymentMethod: true }).join(', '), /server-calculated/);
});

test('sanitizes browser-only invoice item fields', () => {
    assert.deepEqual(sanitizeInvoiceItems([
        { GUID: 'browser-only', ItemName: ' Product ', Quantity: '2', UnitPrice: '5' }
    ]), [
        { ItemName: 'Product', Quantity: 2, UnitPrice: 5 }
    ]);
});

test('rejects unsupported status key types', () => {
    assert.deepEqual(validateStatusKey('123', 'UnsafeType'), ['keyType is invalid']);
});
