// Import necessary modules and dependencies
const firebase = require("../firebase-database");
const admin = require("firebase-admin");
const firestore = firebase.firestore();
const path = require('path');
const joi = require('joi');
const {
   isUserId,
   isFilePath,
} = require("../common-utils/validation-utils")
const {
   isUserSignedIn,
   isUserAdmin
} = require("./user-auth-controller");
const { uploadFileToFolder } = require("../common-utils/storage-utils");

/**
 * jois if a provided user object adheres to the required schema.a
 * @param {Object} user - The user object to joi.
 * @returns {boolean} True if the user object is valid, false otherwise.
 */
const isUser = (user) => {
   const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string(),
      firstName: joi.string().required(),
      lastName: joi.string().allow(null).required(),
      phoneNumber: joi.string().allow(null).required(),
      street: joi.string().allow(null).required(),
      city: joi.string().allow(null).required(),
      zipCode: joi.number().allow(null).required(),
      country: joi.string().allow(null).required(),
      photoURL: joi.string().uri().allow(null).required(),
      role: joi.string().valid("administrator", "user")
   });

   return !schema.validate(user).error;
};

/**
 * Adds a new user to the system.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const addNewUser = async (request, response) => {
   let userCredential;

   try {
      const newUser = request.body;

      if (!isUser(newUser) || !newUser.password) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      if (newUser.role === "administrator") {
         if (!isUserSignedIn() || !(await isUserAdmin(firebase.auth().currentUser.uid))) {
            throw Error("Current user cannot create administrator accounts.");
         }
      }

      userCredential = await firebase.auth().createUserWithEmailAndPassword(
         newUser.email,
         newUser.password
      );

      await admin.auth().updateUser(userCredential.user.uid, {
         displayName: newUser.firstName,
      });

      await firestore.collection("user-meta").doc(userCredential.user.uid).set({
         firstName: newUser.firstName,
         lastName: newUser.lastName,
         phoneNumber: newUser.phoneNumber,
         street: newUser.street,
         city: newUser.city,
         zipCode: newUser.zipCode,
         country: newUser.country,
         photoURL: newUser.photoURL,
         role: newUser.role,
      });

      //await userCredential.user.sendEmailVerification();

      response.status(200).json({
         id: userCredential.user.uid,
         idToken: await userCredential.user.getIdToken(),
      });
   } catch (error) {
      if (userCredential) {
         firebase.auth().currentUser.delete();
      }

      response.status(400).json({ error: error.message });
   }
};

/**
 * Updates user information in the system.
 * @param {Object} request - The HTTP request object containing the user ID and updated user data.
 * @param {Object} response - The HTTP response object to be sent after processing.
 */
const updateUser = async (request, response) => {
   try {
      const userId = request.params.userId;

      if (!isUserId(userId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const userUpdate = request.body;

      if (!isUser(userUpdate)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      if (userUpdate.role === "administrator") {
         if (!isUserSignedIn() || !(await isUserAdmin(firebase.auth().currentUser.uid))) {
            throw Error("Current user cannot update administrator accounts.");
         }
      }

      await admin.auth().updateUser(userId, {
         email: userUpdate.email,
         // password: userUpdate.password,
         displayName: userUpdate.firstName
      });

      await firestore.collection("user-meta").doc(userId).set({
         firstName: userUpdate.firstName,
         lastName: userUpdate.lastName,
         phoneNumber: userUpdate.phoneNumber,
         street: userUpdate.street,
         city: userUpdate.city,
         zipCode: userUpdate.zipCode,
         country: userUpdate.country,
         photoURL: userUpdate.photoURL,
         role: userUpdate.role,
      });

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

const updateUserPassword = async (request, response) => {
   try {
      const userId = request.params.userId;

      if (!isUserId(userId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const userUpdate = request.body;

      if (!userUpdate.password) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      await admin.auth().updateUser(userId, {
         password: userUpdate.password
      });

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

/**
 * Deletes a user from the system.
 * @param {Object} request - The HTTP request object containing the user ID in the parameters.
 * @param {Object} response - The HTTP response object to be sent after processing.
 */
const deleteUser = async (request, response) => {
   try {
      const userId = request.params.userId;

      if (!isUserId(userId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      await admin.auth().deleteUser(userId);

      await firestore.collection("user-meta").doc(userId).delete();

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Uploads a photo to the specified user folder in Firebase Storage.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const uploadUserPhoto = async (request, response) => {
   try {
      const userId = request.params.userId;

      if (!isUserId(userId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const localFilePath = request.body.localFilePath;

      if (!isFilePath(localFilePath)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const remoteFolder = `user/${userId}`;
      const fileName = path.basename(localFilePath);

      const fileURL = await uploadFileToFolder(remoteFolder, localFilePath, fileName);

      response.status(200).json({ fileURL });
   } catch (error) {
      response.status(500).json({ error: error.message });
   }
};

/**
 * Retrieves user data and metadata for a given user ID.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const getUser = async (request, response) => {
   try {
      const userId = request.params.userId;

      if (!isUserId(userId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const userMetaDoc = await firestore.collection("user-meta").doc(userId).get();
      const userMetaData = userMetaDoc.data();

      const user = await admin.auth().getUser(userMetaDoc.id);

      response.status(200).json({ email: user.email, ...userMetaData });
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves all users from the 'user-meta' collection along with their additional information.
 * @param {Object} request - The incoming request object.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const getAllUsers = async (request, response) => {
   try {
      const userMetaRef = admin.firestore().collection('user-meta');
      const snapshot = await userMetaRef.get();

      const users = [];
      for (const doc of snapshot.docs) {
         const userMetaData = doc.data();
         const user = await admin.auth().getUser(doc.id);
         users.push({
            email: user.email,
            ...userMetaData
         });
      }

      response.status(200).json(users);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

// Export controller functions
module.exports = {
   addNewUser,
   updateUser,
   updateUserPassword,
   deleteUser,
   uploadUserPhoto,
   getUser,
   getAllUsers
}