// Import necessary modules and dependencies
const admin = require("firebase-admin");
const path = require('path');

/**
 * Deletes all files in the specified folder.
 * @param {string} folderPath - The path to the folder containing the files to be deleted.
 * @returns {Promise<boolean>} - Returns `true` if all files were successfully deleted.
 * @throws {Error} - If an error occurs during the deletion process.
 */
const deleteFilesInFolder = async (folderPath) => {
   try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: folderPath });

      const deletePromises = files.map(file => file.delete());
      await Promise.all(deletePromises);

      return true;
   } catch (error) {
      throw Error(error.message);
   }
};

/**
 * Retrieves the URL of a file in the specified folder that has the given suffix.
 * @param {string} folderPath - The path to the folder containing the files.
 * @param {string} suffix - The suffix that the file name should end with.
 * @returns {Promise<string>} - The URL of the found file with the specified suffix.
 * @throws {Error} - If the requested file is not found or an error occurs.
 */
const getFileURLWithSuffix = async (folderPath, suffix) => {
   try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: folderPath });

      const file = files.find(file => {
         const fileName = path.parse(file.name).name;
         return fileName.endsWith(suffix);
      });

      if (file) {
         const [fileURL] = await bucket
            .file(file.name)
            .getSignedUrl({
               action: 'read',
               expires: '01-01-3000'
            });

         return fileURL;
      } else {
         throw Error('The requested resources could not be found.');
      }
   } catch (error) {
      throw Error(error.message);
   }
};

/**
 * Uploads a file from a local path to a specified folder in Firebase Storage.
 * @param {string} folderPath - The path to the folder where the file will be uploaded.
 * @param {string} localFilePath - The local file path of the file to be uploaded.
 * @param {string} remoteFileName - The desired remote file name for the uploaded file.
 * @returns {Promise<string>} The URL of the uploaded file.
 * @throws {Error} If there's an error during the file upload process.
 */
const uploadFileToFolder = async (folderPath, localFilePath, remoteFileName) => {
   try {
      const bucket = admin.storage().bucket();
      const remoteFilePath = `${folderPath}/${remoteFileName}`;
      await bucket.upload(localFilePath, { destination: remoteFilePath });

      const [file] = await bucket.file(remoteFilePath).getSignedUrl({
         action: 'read',
         expires: '01-01-3000'
      });

      return file;
   } catch (error) {
      throw Error(error.message);
   }
};

/**
 * Finds the featured image file within a specified folder path.
 * @param {string} folderPath - The path of the folder to search for the featured image file.
 * @returns {Promise<object|null>} - The featured image file object if found, otherwise null.
 */
const findFeatImageFile = async (folderPath) => {
   try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: folderPath });

      const featImage = files.find(file => {
         const fileName = path.basename(file.name, path.extname(file.name));
         return fileName.endsWith("-feat");
      });

      if (!featImage) {
         throw new Error('The requested resources could not be found.');
      }

      return featImage;
   } catch (error) {
      throw new Error(error.message);
   }
};

// Export functions
module.exports = {
   deleteFilesInFolder,
   getFileURLWithSuffix,
   uploadFileToFolder,
   findFeatImageFile
}