// Import Joi library for schema validation
const joi = require('joi');

/**
 * Checks if a given string represents a file path that may contain slashes and backslashes.
 * @param {string} filePath - The string to be checked.
 * @returns {boolean} - Returns true if the input matches the format of a file path.
 */
const isFilePath = (filePath) => {
   const pattern = /^(?:[a-zA-Z]:)?[\\/](?:[^\\/]+[\\/])*[^\\/]+$/;
   return pattern.test(filePath);
}

/**
 * Checks if a given collection ID is valid firebase collection id.
 * @param {string} collectionId - The collection ID to validate.
 * @returns {boolean} True if the collection ID is valid; otherwise, false.
 */
const isCollectionId = (collectionId) => {
   const schema = joi.string().alphanum().length(20).required();
   return !schema.validate(collectionId).error
};

/**
 * Validates whether the given tag object is valid.
 * @param {object} tag - The tag object to be validated.
 * @returns {boolean} Returns true if the tag object is valid, otherwise false.
 */
const isTag = (tag) => {
   const schema = joi.object({
      name: joi.string().required().regex(/^\w+(?:\s+\w+)*$/)
   });

   return !schema.validate(tag).error;
};

/**
 * jois if a provided user ID adheres to the required format.
 * @param {string} userId - The user ID to joi.
 * @returns {boolean} True if the user ID is valid, false otherwise.
 */
const isUserId = (userId) => {
   const schema = joi.string().alphanum().length(28).required();
   return !schema.validate(userId).error;
}

// Export functions
module.exports = {
   isFilePath,
   isCollectionId,
   isTag,
   isUserId
}