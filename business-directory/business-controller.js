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
 * Verifies whether an object is a valid Business.
 * @param {Object} business - The object to be verified.
 * @returns {boolean} Returns true if the provided object is a valid Business.
 */
const isBusiness = (business) => {
   const daysOfWeek = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
   ];

   const daySchema = joi.object({
      day: joi.string().valid(...daysOfWeek).required(),
      isOpen: joi.boolean().required(),
      commence: joi.string().regex(/^\d{2}:\d{2}$/).allow(null).required(),
      finish: joi.string().regex(/^\d{2}:\d{2}$/).allow(null).required(),
   });

   const schema = joi.object({
      name: joi.string().required(),
      description: joi.string().allow(null).required(),
      tags: joi.array().items(joi.string().alphanum().length(20)).allow(null).required(),
      phoneNumber: joi.string().allow(null).required(),
      phoneNumberSecondary: joi.string().allow(null).required(),
      email: joi.string().email().allow(null).required(),
      website: joi.string().uri().allow(null).required(),
      address: joi.string().allow(null).required(),
      city: joi.string().allow(null).required(),
      isFeatured: joi.boolean().required(),
      timeTable: joi.array().items(daySchema).unique((a, b) => a.day === b.day).required(),
      appointments: joi.object().required(),
      featuredImageURL: joi.string().uri().allow(null).required(),
   });

   return !schema.validate(business).error;
};

/**
 * Adds a new business to the Firestore database.
 * @param {Object} request - The incoming request object containing the business details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const addNewBusiness = async (request, response) => {
   try {
      const newBusiness = request.body;

      if (!isBusiness(newBusiness)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const businessRef = await firestore.collection("business").add(newBusiness);

      response.status(200).json({ businessId: businessRef.id });
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Updates a business in the Firestore database.
 * @param {Object} request - The incoming request object containing business update details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const updateBusiness = async (request, response) => {
   try {
      const businessId = request.params.businessId;

      if (!isCollectionId(businessId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const businessUpdate = request.body;

      if (!isBusiness(businessUpdate)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const businessRef = firestore.collection("business").doc(businessId);
      await businessRef.update(businessUpdate);

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Deletes a business from the Firestore database.
 * @param {Object} request - The incoming request object containing business deletion details.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const deleteBusinessAndFiles = async (request, response) => {
   try {
      const businessId = request.params.businessId;

      if (!isCollectionId(businessId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      await firestore.collection("business").doc(businessId).delete();

      await deleteFilesInFolder(`business/${businessId}/`);

      response.sendStatus(200);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves all documents from the "business" collection in Firestore.
 * @param {Object} request - The incoming request object.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const getAllBusinesses = async (request, response) => {
   try {
      const querySnapshot = await firestore.collection('business').get();

      const businesses = [];
      querySnapshot.forEach((doc) => {
         const businessData = doc.data();
         businesses.push({
            businessId: doc.id,
            business: {
               ...businessData
            }
         });
      });

      response.status(200).json(businesses);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
* Retrieves a list of featured businesses from the firestore database.
* Businesses with the 'isFeatured' field set to true are returned.
* @param {Object} request - The incoming request object.
* @param {Object} response - The response object used to send the result back to the client.
*/
const getFeatBusinesses = async (request, response) => {
   try {
      const querySnapshot = await firestore
         .collection("business")
         .where("isFeatured", "==", true)
         .get();

      const featBusinesses = [];
      querySnapshot.forEach((doc) => {
         const businessData = doc.data();
         featBusinesses.push({
            businessId: doc.id,
            business: {
               ...businessData
            }
         });
      });

      response.status(200).json(featBusinesses);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Validates whether an object is suitable for business search criteria.
 * @param {Object} searchParams - The object representing the business search criteria.
 * @returns {boolean} Returns true if the provided object is valid for business search criteria.
 */
const isSearchParameters = (searchParams) => {
   if (searchParams.tags) {
      searchParams.tags = searchParams.tags.split(',');
   }

   const schema = joi.object({
      name: joi.string().allow(null, "").required(),
      city: joi.string().allow(null, "").required(),
      tags: joi.array().items(joi.string()).allow(null, "").required(),
   });

   return !schema.validate(searchParams).hasOwnProperty("error");
};

/**
 * Search for businesses in the firestore database that match the specified criteria.
 * @param {Object} request - The incoming request object containing the search criteria.
 * @param {Object} response - The response object used to send the result back to the client.
 */
const getMatchingBusinesses = async (request, response) => {
   try {
      const { name, city, tags } = request.query;

      if (!isSearchParameters({ name, city, tags })) {
         throw Error("The query parameters provided are not valid or acceptable.");
      }

      let businessQuery = firestore.collection("business");

      if (tags) {
         businessQuery = businessQuery.where("tags", "array-contains-any", tags.split(','));
      }

      if (city) {
         businessQuery = businessQuery.where("city", "==", city.toLowerCase());
      }

      const querySnapshot = await businessQuery.get();

      const matchedBusinesses = [];
      querySnapshot.forEach((doc) => {
         const businessData = doc.data();
         if (businessData.name.toLowerCase().includes(name.toLowerCase())) {
            matchedBusinesses.push({
               businessId: doc.id,
               business: {
                  ...businessData
               }
            });
         }
      });

      response.status(200).json(matchedBusinesses);
   } catch (error) {
      response.status(400).json({ error: error.message });
   }
};

/**
 * Retrieves the featured image for a business from Firebase storage.
 * @param {object} request - The HTTP request object containing the business ID.
 * @param {object} response - The HTTP response object to send the image URL or error message.
 */
const getBusinessFeatImage = async (request, response) => {
   try {
      const businessId = request.params.businessId;

      if (!isCollectionId(businessId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const fileURL = await getFileURLWithSuffix(`business/${businessId}/`, "-feat");

      response.status(200).json({ fileURL });
   } catch (error) {
      response.status(500).json({ error: error.message });
   }
};

/**
 * Deletes the featured image file for a business from Firebase storage.
 * @param {object} request - The HTTP request object containing the business ID.
 * @param {object} response - The HTTP response object to send the result back to the client.
 */
const deleteBusinessFeatImage = async (request, response) => {
   try {
      const businessId = request.params.businessId;

      if (!isCollectionId(businessId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const featImage = await findFeatImageFile(`business/${businessId}/`);
      await featImage.delete();

      response.sendStatus(200);
   } catch (error) {
      response.status(500).json({ error: error.message });
   }
};

/**
 * Uploads a featured image to the specified business folder in Firebase Storage.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 */
const uploadBusinessFeatImage = async (request, response) => {
   try {
      const businessId = request.params.businessId;

      if (!isCollectionId(businessId)) {
         throw Error("The request parameter provided is not valid or acceptable.");
      }

      const localFilePath = request.body.localFilePath;

      if (!isFilePath(localFilePath)) {
         throw Error("The request body provided is not valid or acceptable.");
      }

      const remoteFolder = `business/${businessId}`;
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
   addNewBusiness,
   updateBusiness,
   deleteBusinessAndFiles,
   getFeatBusinesses,
   getMatchingBusinesses,
   getAllBusinesses,
   uploadBusinessFeatImage,
   getBusinessFeatImage,
   deleteBusinessFeatImage
};