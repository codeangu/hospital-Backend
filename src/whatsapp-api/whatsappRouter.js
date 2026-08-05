
const express = require("express");
const bodyParser = require("body-parser");
const verifyUser = require("../../middlewares/authenticate").verifyUser;
const verifyAdmin = require("../../middlewares/authenticate").verifyAdmin;
const whatsappRouter = express.Router();
const cors = require("../cors");
const { sendPdfReport,sendTextMessage, TOKEN } = require('./whatsapp-helper');


whatsappRouter.use(bodyParser.json( ));

whatsappRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  
 //post call for to create
 .post(cors.corsWithOptions, async (req, res, next) => {
 
      
     try {
    const { phoneNumber, reportPath, filename } = req.body;

    const result = await sendPdfReport(
      phoneNumber,
      reportPath,       // e.g. './reports/sales-report.pdf'
      filename || 'report.pdf',
      'Your report is ready!'
    );

    res.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (err) {
    console.error('WhatsApp send error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
   
  

})

  whatsappRouter
  .route("/send-text")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  
 //post call for to create
 .post(cors.corsWithOptions, async (req, res, next) => {
 
  try {
    const { phoneNumber, message } = req.body;
    const result = await sendTextMessage(phoneNumber, message);
    res.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (err) {
    console.error('WhatsApp error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
   
  

})


  whatsappRouter
  .route("/webhook")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  
 // Webhook verification (GET) - Meta verifies your endpoint
 .get(cors.corsWithOptions, async (req, res, next) => {
 
    const VERIFY_TOKEN = TOKEN.access_token; // any string you choose

      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified!');
        return res.status(200).send(challenge);
      }
      res.sendStatus(403);
   
  

})
// Receive messages (POST) - Meta sends incoming messages here
 .post(cors.corsWithOptions, async (req, res, next) => {
 
 const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        // Incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from;           // sender's phone number
            const msgType = message.type;        // text, image, document, etc.
            const timestamp = message.timestamp;

            if (msgType === 'text') {
              const text = message.text.body;
              console.log(`Message from ${from}: ${text}`);

              // Now you can:
              // 1. Save to MongoDB
              // 2. Send auto-reply
              // 3. Open 24-hour window for freeform messages
              handleIncomingMessage(from, text);
            }

            if (msgType === 'image') {
              console.log(`Image from ${from}, media ID: ${message.image.id}`);
            }

            if (msgType === 'document') {
              console.log(`Document from ${from}: ${message.document.filename}`);
            }
          }
        }

        // Message status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            console.log(`Message ${status.id} -> ${status.status}`);
            // status.status = 'sent' | 'delivered' | 'read' | 'failed'
          }
        }
      }
    }
  }

  // Always return 200 quickly, otherwise Meta will retry
  res.sendStatus(200);
   
  

})

async function handleIncomingMessage(from, text) {
  // Save to database
  await Message.create({
    from,
    body: text,
    direction: 'incoming',
    timestamp: new Date(),
  });

  // Auto-reply (24-hour window is now OPEN since user messaged you)
  // Now you can send freeform text, PDFs, anything!
  const lowerText = text.toLowerCase();

  if (lowerText.includes('report')) {
    // Send their report PDF
    const mediaId = await uploadMedia('./reports/latest-report.pdf');
    await sendDocument(from, mediaId, 'report.pdf', 'Here is your report!');
  } else {
    await sendTextMessage(from, 'Thanks for your message! Reply "report" to get your latest report.');
  }
}

module.exports = whatsappRouter;
