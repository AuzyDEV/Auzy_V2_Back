// Import necessary modules and dependencies
const firebase = require("../firebase-database");
const firestore = firebase.firestore();
const {
   isCollectionId,
   isTag
} = require("../common-utils/validation-utils");

/**
 * Adds a new post tag to the Firestore database.
 * @param {Object} request - The HTTP request object containing the new tag data in the request body.
 * @param {Object} response - The HTTP response object to send the response.
 */
const addNewPostTag = async (request, response) => {
   try {
      const newTag = request.body;

      if (!isTag(newTag)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const tag = await firestore.collection("post-tag").add(newTag);

      response.status(200).json({ tagId: tag.id });
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Updates an existing post tag in the Firestore database.
 * @param {object} request - The HTTP request object containing the tag ID and the updated tag.
 * @param {object} response - The HTTP response object to be sent back to the client.
 */
const updatePostTag = async (request, response) => {
   try {
      const tagId = request.params.tagId;

      if (!isCollectionId(tagId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const tagUpdate = request.body;

      if (!isTag(tagUpdate)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const tagRef = firestore.collection("post-tag").doc(tagId);
      await tagRef.update(tagUpdate);

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Deletes a post tag from the Firestore database.
 * @param {object} request - The HTTP request object containing the tag ID in the URL parameter.
 * @param {object} response - The HTTP response object to be sent back to the client.
 */
const deletePostTag = async (request, response) => {
   try {
      const tagId = request.params.tagId;

      if (!isCollectionId(tagId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      await firestore.collection("post-tag").doc(tagId).delete();

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves a post tag by its ID.
 * @param {object} request - The HTTP request object containing the tag ID in the URL parameter.
 * @param {object} response - The HTTP response object to send the tag data or error.
 */
const getPostTag = async (request, response) => {
   try {
      const tagId = request.params.tagId;

      if (!isCollectionId(tagId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const tagRef = firebase.firestore().collection('post-tag').doc(tagId);
      const tagSnapshot = await tagRef.get();

      if (tagSnapshot.exists) {
         const tagData = tagSnapshot.data();
         response.status(200).json(tagData);
      } else {
         throw Error("Tag not found.");
      }
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves all post tags from the "post-tag" collection.
 * @param {object} response - The HTTP response object to send the retrieved tags or error status.
 */
const getAllPostTags = async (request, response) => {
   try {
      const tagsSnapshot = await firestore.collection("post-tag").get();

      const tags = [];
      tagsSnapshot.forEach((doc) => {
         const tagData = doc.data();
         tags.push({
            tagId: doc.id,
            tag: {
               ...tagData
            }
         });
      });

      response.status(200).json(tags);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

// Export controller functions
module.exports = {
   addNewPostTag,
   deletePostTag,
   updatePostTag,
   getPostTag,
   getAllPostTags
};