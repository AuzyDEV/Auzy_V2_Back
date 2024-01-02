// Import the Express framework and create a router
const express = require("express");
const router = express.Router();

// Import business-related controller functions
const {
   addNewConversation,
   getConversationByMembers,
   getConversationMessages,
   sendMessage
} = require("./chat-controller");

// Chat related routes
router.post("/add-new-conversation", addNewConversation);
router.get("/get-conversation-by-members", getConversationByMembers);
router.get("/get-conversation-messages/:conversationId", getConversationMessages);
router.post("/send-message", sendMessage);

// Export the router with defined routes
module.exports = router;