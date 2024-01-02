// Import necessary modules and dependencies
const firebase = require("../firebase-database");
const admin = require("firebase-admin");
const joi = require('joi');

/**
 * Checks if a user is currently signed in.
 * @returns {boolean} True if a user is signed in, false otherwise.
 */
const isUserSignedIn = () => {
   const user = firebase.auth().currentUser;
   return !!user;
}

/**
 * Checks if a user with the specified user ID has administrator privileges.
 * @param {string} userId - The user ID to check.
 * @returns {Promise<boolean>} Promise that resolves to true if the user is an administrator.
 * @throws {Error} If an error occurs during the process.
 */
const isUserAdmin = async (userId) => {
   try {
      const userMetaRef = firebase.firestore().collection('user-meta').doc(userId);
      const userMetaSnapshot = await userMetaRef.get();

      if (userMetaSnapshot.exists) {
         const userData = userMetaSnapshot.data();
         return userData.role == "administrator"
      } else {
         throw Error('User metadata could not be located.');
      }
   } catch (error) {
      throw Error(error.message);
   }
}

/**
 * Authenticates a user through email and password, and provides an ID token.
 * @param {Object} request - The incoming request object containing user login details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const signIn = async (request, response) => {
   try {
      const { email, password } = request.body;

      if (joi.string().email().validate(email).error) {
         throw Error("The provided email address is either empty or in an invalid format.");
      }

      if (joi.string().validate(password).error) {
         throw Error("The provided password is empty or in an valid format.");
      }

      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

      // if (userCredential.user.emailVerified == false) {
      //    await firebase.auth().signOut();
      //    throw Error("The verification email was not confirmed.");
      // }

      response.status(200).json({
         id: userCredential.user.uid,
         idToken: await userCredential.user.getIdToken()
      });
   } catch (error) {
      if (error.code === "auth/user-not-found")
         response.status(404).json({ error: error.message });
      else
         response.status(400).json({ error: error.message });
   }
};

/**
 * Signs the user out of the current session.
 * @param {Object} request - The incoming request object for signing out.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const signOut = async (request, response) => {
   try {
      await firebase.auth().signOut();
      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Resets a user's password by sending a password reset email.
 * @param {Object} request - The HTTP request object containing the user's email in the request body.
 * @param {Object} response - The HTTP response object to be sent after processing.
 */
const resetPassword = async (request, response) => {
   try {
      const email = request.body.email;

      if (joi.string().email().validate(email).error) {
         throw Error("The provided email address is either empty or in an invalid format.");
      }

      await firebase.auth().sendPasswordResetEmail(email);
      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Middleware function to verify the authenticity of an authorization token.
 * @param {Object} request - The incoming request object.
 * @param {Object} response - The response object used to send the result back to the client.
 * @param {Function} next - The next middleware function to be executed.
 */
const verifyAuthToken = async (request, response, next) => {
   const idToken = request.header("Authorization")?.split(' ')[1];

   if (idToken) {
      try {
         request.user = await admin.auth().verifyIdToken(idToken);
         next();
      } catch (error) {
         response.status(403).json({ error: error.message });
      }
   } else {
      response.status(401).json({ error: "The token has not been received." });
   }
};

/**
 * Refreshes the authentication token for the current user.
 * @param {Object} request - The incoming request object.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const refreshAuthToken = async (request, response) => {
   try {
      if (!isUserSignedIn()) {
         throw Error("Token refresh is not possible as the user has been signed out.");
      }

      const newIdToken = await firebase.auth().currentUser.getIdToken(true);
      response.status(200).json({ idToken: newIdToken });
   } catch (error) {
      response.status(403).json({ error: error.message });
   }
};

/**
 * Middleware function to verify if the user is an admin before granting access to resources.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 * @param {Function} next - The next function in the middleware chain.
 */
const verifyAdminUser = async (request, response, next) => {
   try {
      if (!await isUserAdmin(request.user.user_id)) {
         throw Error("Access to resources is denied for the user.");
      }
      next();
   } catch (error) {
      response.status(403).json({ error: error.message });
   }
}

// Export controller functions
module.exports = {
   isUserSignedIn,
   isUserAdmin,
   signIn,
   signOut,
   resetPassword,
   verifyAuthToken,
   refreshAuthToken,
   verifyAdminUser
};