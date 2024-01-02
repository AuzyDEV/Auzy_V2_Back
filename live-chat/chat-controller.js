// Import necessary modules and dependencies
const firebase = require("../firebase-database");
const firestore = firebase.firestore();
const joi = require('joi');
const {
   isCollectionId,
   isUserId
} = require("../common-utils/validation-utils");

/**
 * Create a new chat conversation document in Firestore based on provided member IDs.
 * @param {Object} request - The HTTP request object containing member IDs in the request body.
 * @param {Object} response - The HTTP response object to send a status code and response data.
 */
const addNewConversation = async (request, response) => {
   try {
      const { memberOneId, memberTwoId } = request.body;

      if (!isUserId(memberOneId) || !isUserId(memberTwoId)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const conversationRef = await firestore.collection('chat-conversation').add({
         memberOneId,
         memberTwoId,
      });

      response.status(200).json({ conversationId: conversationRef.id });
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

/**
 * Retrieve a conversation ID by querying Firestore using member IDs.
 * @param {Object} request - The HTTP request object containing member IDs in the query.
 * @param {Object} response - The HTTP response object to send a status code and response data.
 */
const getConversationByMembers = async (request, response) => {
   try {
      const { memberOneId, memberTwoId } = request.query;

      if (!isUserId(memberOneId) || !isUserId(memberTwoId)) {
         throw Error("The request query provided is not valid or acceptable.");
      }

      const query = firestore.collection('chat-conversation')
         .where('memberOneId', '==', memberOneId)
         .where('memberTwoId', '==', memberTwoId);

      const snapshot = await query.get();
      const documentIds = snapshot.docs.map(doc => doc.id);

      if (!documentIds[0]) {
         response.sendStatus(404);
      } else {
         response.status(200).json({ conversationId: documentIds[0] });
      }
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

/**
 * Retrieve messages for a specific conversation from Firestore.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const getConversationMessages = async (request, response) => {
   try {
      const conversationId = request.params.conversationId;

      if (!isCollectionId(conversationId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const querySnapshot = await firestore
         .collection('chat-message')
         .doc(conversationId)
         .collection('messages')
         .get();

      const messages = [];
      querySnapshot.forEach((doc) => {
         const messageData = doc.data();
         messages.push({
            messageId: doc.id,
            message: {
               ...messageData
            }
         });
      });

      if (messages.length === 0) {
         response.sendStatus(404);
      } else {
         response.status(200).json(messages);
      }
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

/**
 * Verifies whether an object is a valid Message.
 * @param {Object} business - The object to be verified.
 * @returns {boolean} Returns true if the provided object is a valid Business.
 */
const isMessage = (message) => {
   const schema = joi.object({
      conversationId: joi.string().alphanum().length(20).required(),
      senderId: joi.string().alphanum().length(28).required(),
      message: joi.string().required(),
   });

   return !schema.validate(message).error;
};

/**
 * Send a new message to a specific conversation and store it in Firestore.
 * @param {Object} request - The HTTP request object containing the new message data.
 * @param {Object} response - The HTTP response object to send a status code and response data.
 */
const sendMessage = async (request, response) => {
   try {
      const newMessage = request.body;

      if (!isMessage(newMessage)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const { senderId, message, conversationId } = newMessage;
      const timestamp = Math.floor(new Date() / 1000);

      const messageRef = await firestore
         .collection('chat-message')
         .doc(conversationId)
         .collection('messages')
         .add({ senderId, message, timestamp });

      response.status(200).json({ messageId: messageRef.id });
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

// Export controller functions
module.exports = {
   addNewConversation,
   getConversationByMembers,
   getConversationMessages,
   sendMessage
}