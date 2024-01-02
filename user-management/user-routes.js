// Import the Express framework to create router
const express = require("express");
const router = express.Router();

// Import user management controller functions
const {
   addNewUser,
   updateUser,
   updateUserPassword,
   deleteUser,
   getUser,
   getAllUsers,
   uploadUserPhoto
} = require("./user-controller");

// Import user authentication controller functions
const {
   signIn,
   signOut,
   resetPassword,
   verifyAuthToken,
   refreshAuthToken,
   verifyAdminUser
} = require("./user-auth-controller");

// User management routes
router.post("/add-new-user", addNewUser);
router.put("/update-user/:userId", verifyAuthToken, updateUser);
router.put("/update-user-password/:userId", updateUserPassword);
router.delete("/delete-user/:userId", deleteUser);
router.post("/upload-user-photo/:userId", uploadUserPhoto);
router.get("/get-user/:userId", verifyAuthToken, getUser);
router.get("/get-all-users", getAllUsers);

// User authentication routes
router.post("/sign-in", signIn);
router.get("/sign-out", signOut);
router.get("/refresh-auth-token", refreshAuthToken);
router.post("/reset-password", resetPassword);

// router.get("/test/", verifyAuthToken, verifyAdminUser, (req, resp) => {
//    console.log("Testing route: Okay, this works.");
//    resp.sendStatus(200);
// });

// Export the router for use in the main application
module.exports = router;