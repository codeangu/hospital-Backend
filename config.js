// Local dev config. Replace mongoUrl with your real MongoDB connection string
// to make data routes work.
module.exports = {
  secretKey: process.env.SECRET_KEY || 'patientcare-local-dev-secret',
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/patientcare',
  facebook: {
    clientId: process.env.FB_CLIENT_ID || 'dummy-fb-client-id',
    clientSecret: process.env.FB_CLIENT_SECRET || 'dummy-fb-client-secret'
  }
};
