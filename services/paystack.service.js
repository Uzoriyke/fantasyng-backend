const axios = require('axios');
const BASE = 'https://api.paystack.co';
const headers = () => ({ Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY });

// All supported payment channels shown on checkout popup
const ALL_CHANNELS = [
  'card',           // Visa, Mastercard, Verve (Nigerian + international)
  'bank',           // Direct debit from any Nigerian bank
  'bank_transfer',  // Instant bank transfer (OPay, PalmPay, Moniepoint etc.)
  'ussd',           // USSD codes for all major Nigerian banks
  'mobile_money',   // Mobile money wallets
  'qr'              // QR code payments
];

const initializeTransaction = async ({ email, amount, metadata, callback_url }) => {
  const r = await axios.post(
    BASE + '/transaction/initialize',
    {
      email,
      amount,
      metadata,
      callback_url,
      channels: ALL_CHANNELS,  // Show ALL payment options on checkout
      currency: 'NGN'          // Nigerian Naira
    },
    { headers: headers() }
  );
  if (!r.data.status) throw new Error('Paystack init failed');
  return r.data.data;
};

const verifyTransaction = async (reference) => {
  const r = await axios.get(BASE + '/transaction/verify/' + reference, { headers: headers() });
  if (!r.data.status) throw new Error('Paystack verify failed');
  return r.data.data;
};

module.exports = { initializeTransaction, verifyTransaction };
