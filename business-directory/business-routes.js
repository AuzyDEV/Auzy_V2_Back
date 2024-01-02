// Import the Express framework and create a router
const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../user-management/user-auth-controller");

// Import business-related controller functions
const {
   addNewBusiness,
   updateBusiness,
   deleteBusinessAndFiles,
   getFeatBusinesses,
   getMatchingBusinesses,
   getAllBusinesses,
   getBusinessFeatImage,
   uploadBusinessFeatImage,
   deleteBusinessFeatImage
} = require("./business-controller");

// Import business tag-related controller functions
const {
   addNewBusinessTag,
   deleteBusinessTag,
   updateBusinessTag,
   getBusinessTag,
   getAllBusinessTags
} = require("./business-tag-controller");

// Business related routes
router.post("/add-new-business", addNewBusiness);
router.put("/update-business/:businessId", updateBusiness);
router.delete("/delete-business-and-files/:businessId", deleteBusinessAndFiles);
router.get("/get-feat-businesses", verifyAuthToken, getFeatBusinesses);
router.get("/get-matching-businesses", verifyAuthToken, getMatchingBusinesses);
router.get("/get-all-businesses", getAllBusinesses);
router.get("/get-business-feat-image/:businessId", getBusinessFeatImage);
router.post("/upload-business-feat-image/:businessId", uploadBusinessFeatImage);
router.delete("/delete-business-feat-image/:businessId", deleteBusinessFeatImage);

// Business Tag related routes
router.post("/add-new-business-tag", addNewBusinessTag);
router.put("/update-business-tag/:tagId", updateBusinessTag);
router.delete("/delete-business-tag/:tagId", deleteBusinessTag);
router.get("/get-business-tag/:tagId", getBusinessTag);
router.get("/get-all-business-tags", verifyAuthToken, getAllBusinessTags);

// Export the router with defined routes
module.exports = router;