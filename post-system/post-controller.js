// Import necessary modules and dependencies
const firebase = require("../firebase-database");
const firestore = firebase.firestore();
const path = require('path');
const joi = require('joi');
const {
   isFilePath,
   isCollectionId
} = require("../common-utils/validation-utils")
const {
   getFileURLWithSuffix,
   deleteFilesInFolder,
   uploadFileToFolder,
   findFeatImageFile
} = require("../common-utils/storage-utils")

/**
 * Verifies whether an object is a valid Post.
 * @param {Object} post - The post object to be validated.
 * @returns {boolean} - Returns true if the 'post' object is valid according to the schema, otherwise false.
 */
const isPost = (post) => {
   const schema = joi.object({
      title: joi.string().required(),
      content: joi.string().allow(null).required(),
      tags: joi.array().items(joi.string().alphanum().length(20)).allow(null).required(),
      isFeatured: joi.boolean().required(),
      featuredImageURL: joi.string().uri().allow(null).required(),
      timestamp: joi.number().integer().min(0).required(),
      authorId: joi.string().alphanum().length(28).required()
   });

   return !schema.validate(post).error;
};

/**
 * Adds a new post to the Firestore database.
 * @param {Object} request - The incoming request object containing the post details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const addNewPost = async (request, response) => {
   try {
      const newPost = request.body;

      if (!isPost(newPost)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const postRef = await firestore.collection("post").add(newPost);

      response.status(200).json({ postId: postRef.id });
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

/**
 * Updates a post in the Firestore database.
 * @param {Object} request - The incoming request object containing post update details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const updatePost = async (request, response) => {
   try {
      const postId = request.params.postId;

      if (!isCollectionId(postId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const postUpdate = request.body;

      if (!isPost(postUpdate)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const postRef = firestore.collection("post").doc(postId);
      await postRef.update(postUpdate);

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
}

/**
 * Deletes a post from the Firestore database and associated files.
 * @param {Object} request - The incoming request object containing post deletion details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const deletePostAndFiles = async (request, response) => {
   try {
      const postId = request.params.postId;

      if (!isCollectionId(postId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      await firestore.collection("post").doc(postId).delete();

      await deleteFilesInFolder(`post/${postId}/`);

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves all posts from the Firestore database.
 * @param {Object} request - The incoming request object.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const getAllPosts = async (request, response) => {
   try {
      const querySnapshot = await firestore.collection('post').get();

      const posts = [];
      querySnapshot.forEach((doc) => {
         const businessData = doc.data();
         posts.push({
            postId: doc.id,
            post: {
               ...businessData
            }
         });
      });

      response.status(200).json(posts);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

// --------------------------------- To edit

const isSearchParameters = (searchParams) => {
   if (searchParams.tags) {
      searchParams.tags = searchParams.tags.split(',');
   }

   const schema = joi.object({
      tags: joi.array().items(joi.string()).allow(null, "").required(),
   });

   return !schema.validate(searchParams).hasOwnProperty("error");
};


const getPostsByTag = async (request, response) => {
   try {
      const { tags } = request.query;

      if (!isSearchParameters({ tags })) {
         throw Error("The query parameters provided are not valid or acceptable.");
      }

      let postQuery = firestore.collection("post")
         .where("tags", "array-contains-any", tags.split(','));

      const querySnapshot = await postQuery.get();

      const matchedPosts = [];
      querySnapshot.forEach((doc) => {
         const postData = doc.data();
         matchedPosts.push({
            postId: doc.id,
            post: {
               ...postData
            }
         });
      });

      response.status(200).json(matchedPosts);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves a list of featured posts from the Firestore database.
 * Posts with the 'isFeatured' field set to true are returned.
 * @param {Object} request - The incoming request object.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const getFeatPosts = async (request, response) => {
   try {
      const querySnapshot = await firestore
         .collection("post")
         .where("isFeatured", "==", true)
         .get();

      const featPosts = [];
      querySnapshot.forEach((doc) => {
         const postData = doc.data();
         featPosts.push({
            postId: doc.id,
            post: {
               ...postData
            }
         });
      });

      response.status(200).json(featPosts);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves the featured image URL for a specific post.
 * @param {object} request - The request object containing parameters.
 * @param {object} response - The response object used to send responses.
 * @returns {void}
 */
const getPostFeatImage = async (request, response) => {
   try {
      const postId = request.params.postId;

      if (!isCollectionId(postId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const fileURL = await getFileURLWithSuffix(`post/${postId}/`, "-feat");

      response.status(200).json({ fileURL });
   } catch (error) {
      response.status(500).json({ error: error.message });
   }
};

/**
 * Deletes the featured image associated with a post.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const deletePostFeatImage = async (request, response) => {
   try {
      const postId = request.params.postId;

      if (!isCollectionId(postId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const featImage = await findFeatImageFile(`post/${postId}/`);
      await featImage.delete();

      response.sendStatus(200);
   } catch (error) {
      response.status(500).json({ error: error.message });
   }
};

/**
 * Uploads a featured image for a post to the storage.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const uploadPostFeatImage = async (request, response) => {
   try {
      const postId = request.params.postId;

      if (!isCollectionId(postId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const localFilePath = request.body.localFilePath;

      if (!isFilePath(localFilePath)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const remoteFolder = `post/${postId}`;
      const fileName = path.basename(localFilePath);
      const [baseName, extension] = fileName.split('.');
      const remoteFileName = `${baseName}-feat.${extension}`;

      const fileURL = await uploadFileToFolder(remoteFolder, localFilePath, remoteFileName);

      response.status(200).json({ fileURL });
   } catch (error) {
      response.status(500).json({ error: error.message });
   }
};

// Export controller functions
module.exports = {
   addNewPost,
   updatePost,
   deletePostAndFiles,
   getAllPosts,
   getPostsByTag,
   getFeatPosts,
   getPostFeatImage,
   deletePostFeatImage,
   uploadPostFeatImage
}