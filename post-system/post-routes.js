// Import the Express framework and create a router
const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../user-management/user-auth-controller");

// Import business-related controller functions
const {
   addNewPost,
   updatePost,
   deletePostAndFiles,
   getAllPosts,
   getPostsByTag,
   getFeatPosts,
   getPostFeatImage,
   deletePostFeatImage,
   uploadPostFeatImage
} = require("./post-controller");

// Import business tag-related controller functions
const {
   addNewPostTag,
   deletePostTag,
   updatePostTag,
   getPostTag,
   getAllPostTags
} = require("./post-tag-controller");

// Post related routes
router.post("/add-new-post", addNewPost);
router.put("/update-post/:postId", updatePost);
router.delete("/delete-post-and-files/:postId", deletePostAndFiles);
router.get("/get-all-posts", verifyAuthToken, getAllPosts);
router.get("/get-posts-by-tag", verifyAuthToken, getPostsByTag);
router.get("/get-feat-posts", verifyAuthToken, getFeatPosts);
router.get("/get-post-feat-image/:postId", getPostFeatImage);
router.delete("/delete-post-feat-image/:postId", deletePostFeatImage);
router.post("/upload-post-feat-image/:postId", uploadPostFeatImage);

// Post Tag related routes
router.post("/add-new-post-tag", addNewPostTag);
router.put("/update-post-tag/:tagId", updatePostTag);
router.delete("/delete-post-tag/:tagId", deletePostTag);
router.get("/get-post-tag/:tagId", getPostTag);
router.get("/get-all-post-tags", verifyAuthToken, getAllPostTags);

module.exports = router;