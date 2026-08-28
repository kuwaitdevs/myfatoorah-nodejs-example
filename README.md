# MyFatoorah Node.js Example

A runnable Express example showing a safe MyFatoorah redirect-payment lifecycle:

1. Retrieve enabled payment methods.
2. Create an invoice or execute a selected payment method.
3. Redirect the customer to MyFatoorah.
4. Receive the customer callback.
5. verify the result server-side with `GetPaymentStatus`.
6. Fulfill a successful order once.

> This community example is not affiliated with or endorsed by MyFatoorah. Confirm current fields and requirements in the [official documentation](https://docs.myfatoorah.com/).

## Important design decisions

- API tokens are server-side environment variables—never browser values.
- Sandbox and production use separate tokens.
- Callback URLs come from the server-owned `APP_BASE_URL` variable.
- A callback is only a navigation event, not proof of payment.
- The callback handler verifies payment status directly with MyFatoorah.
- Long callback identifiers are treated as `PaymentId`; shorter invoice identifiers are treated as `InvoiceId`.
- MyFatoorah's legacy successful transaction value `Succss` is normalized to `Success`.
- Fulfillment is guarded by an idempotent `action.executed` flag.
- Invoice item totals are recalculated and checked before payment creation.

## Requirements

- Node.js 18 or newer (uses the built-in `fetch` API)
- A MyFatoorah sandbox or production account
- A public HTTPS URL for end-to-end callback testing

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

Configure `.env`:

```dotenv
NODE_ENV=development
PORT=3000
APP_BASE_URL=https://your-public-host.example
MYFATOORAH_TOKEN_DEV=your_sandbox_token
MYFATOORAH_TOKEN_PROD=your_live_token
```

For local callbacks, expose the application through an HTTPS tunnel and use that origin as `APP_BASE_URL`. Restart the server whenever this value changes.

Open:

- `http://localhost:3000/myfatoorah/payment/execute`
- `http://localhost:3000/myfatoorah/payment/list`
- `http://localhost:3000/myfatoorah/payment/inspect`

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/myfatoorah/payment/init` | Retrieve enabled payment methods |
| `POST` | `/api/v1/myfatoorah/payment/execute` | Execute a selected method |
| `POST` | `/api/v1/myfatoorah/payment/send` | Create and send an invoice link |
| `PUT` | `/api/v1/myfatoorah/payment/status` | Verify and persist payment status |
| `GET` | `/api/v1/myfatoorah/payment/details` | Inspect status without fulfillment |
| `GET` | `/myfatoorah/callback/:type` | Verify the callback server-side and render the result |

Allowed callback types are `success` and `error`. Neither path is trusted as the final payment result.

## Sandbox end-to-end test

Use a sandbox token and public HTTPS callback URL. Create a KNET payment, then use the current test credentials published by MyFatoorah. At the time this example was updated, the captured KNET case was:

- Card: `8888880000000001`
- Expiry: `09/30`
- PIN: any four digits

Always check [MyFatoorah test cards](https://docs.myfatoorah.com/docs/test-cards) because test values can change.

A successful test should:

- leave the application for the official KNET sandbox;
- return to the public callback URL;
- show `Success` after server-side verification;
- update the matching local invoice; and
- set `action.executed` only once.

## Automated tests

```sh
npm test
```

Tests cover payment/invoice identifier detection, status normalization, invoice-total validation, payload sanitization, and status key whitelisting.

## Production checklist

This repository uses `node-json-db` only to keep the example understandable. Before production use:

- Replace it with a transactional database.
- Calculate product prices from a server-side catalog; never trust browser totals.
- Add authentication and authorization to payment inspection and list routes.
- Add rate limiting to payment endpoints.
- Verify MyFatoorah webhook signatures and store webhook idempotency keys.
- Use database-level uniqueness for invoice and fulfillment records.
- Add structured logs without tokens or sensitive card/customer data.
- Configure `NODE_ENV=production`, `APP_BASE_URL`, and `MYFATOORAH_TOKEN_PROD` in the hosting platform.
- Test one small live transaction, cancellation, callback retry, and duplicate callback.

## Fulfillment

The idempotent fulfillment placeholder is in `refreshPaymentStatus()`. Replace the comment with your own action—such as issuing a license, granting account access, or emailing an expiring download link—while preserving the `action.executed` guard.

## License

ISC
