require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("./collectorx-7586c-firebase-adminsdk-fbsvc-a3e57eff1f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

module.exports = { bucket };
