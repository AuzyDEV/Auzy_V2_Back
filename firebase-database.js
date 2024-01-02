// Load environment variables from a .env file
require('dotenv').config();

// Require necessary modules
const firebase = require("firebase");
const admin = require('firebase-admin');
const serviceAccount = require("./firebase-service-account.json");

// Initialize Firebase Admin SDK with the provided service account credentials
admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
   databaseURL: "https://auzy-43d3e-default-rtdb.europe-west1.firebasedatabase.app/",
   storageBucket: "gs://auzy-43d3e.appspot.com"
});

// Initialize Firebase client SDK with configuration parameters from environment variables
const database = firebase.initializeApp({
   apiKey: process.env.API_KEY,
   authDomain: process.env.AUTH_DOMAIN,
   databaseURL: process.env.DATABASE_URL,
   projectId: process.env.PROJECT_ID,
   storageBucket: process.env.STORAGE_BUCKET,
   messagingSenderId: process.env.MESSAGING_SENDER_ID,
   appId: process.env.APP_ID
});

// Export the initialized Firebase client SDK instance
module.exports = database;