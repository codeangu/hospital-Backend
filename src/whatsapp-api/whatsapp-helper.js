// whatsappService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const WHATSAPP_TOKEN = 'EAANMS77eQPcBRHQRZAwwkidqEf63Nyxh1PouiZCQbPwcvaja1ZBcmJAIRGVDRvrZCtgUeZBWekZBTUA9aWmDGNjSUZBXlHWnZCZCrTzbXc2Su8fB5kfMLRrEtQndOZCOINmS3h3YxZCpBPgPuZCH7q0FN0RkdTjaiXzWlbkT2GkV4X3J8oEorkcbpOK3pSuJU76jIvz16FN5j44VGsubMopdTzsAcGkFcX2ZATTUNC0weWmenZAOHl2ZAwZA71frKwoesJ7tbvQORfok9rr3FHhQqzaGftTLsas63U0RwgeZAw2oL6QZDZD';
const TOKEN = {
  "access_token": WHATSAPP_TOKEN,
}
// process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = '1122080740978434'
// process.env.WHATSAPP_PHONE_NUMBER_ID;
const BASE_URL = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}`;

// Step 1: Upload the PDF to WhatsApp's media server
async function uploadMedia(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'application/pdf');

  const { data } = await axios.post(`${BASE_URL}/media`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
  });
  return data.id; // media ID
}

// Step 2: Send the PDF as a document message
async function sendDocument(to, mediaId, filename, caption) {
  const { data } = await axios.post(
    `${BASE_URL}/messages`,
    {
      messaging_product: 'whatsapp',
      to, // e.g. '923001234567' (country code, no +)
      type: 'document',
      document: {
        id: mediaId,
        filename: filename || 'report.pdf',
        caption: caption || 'Here is your report',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}
async function sendTextMessage(to, message) {
  
  const { data } = await axios.post(
    `${BASE_URL}/messages`,
    {
      messaging_product: 'whatsapp',
     
      to,              // e.g. '923001234567'
      type: 'text',
      text: {
        body: message,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}

// Combined helper
async function sendPdfReport(phoneNumber, filePath, filename, caption) {
  const mediaId = await uploadMedia(filePath);
  return sendDocument(phoneNumber, mediaId, filename, caption);
}

module.exports = { sendPdfReport ,sendTextMessage, TOKEN};