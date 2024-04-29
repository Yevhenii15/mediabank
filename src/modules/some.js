// SoMe.js
import { uploadBytes, getDownloadURL, getStorage, listAll, ref as storageRef, deleteObject } from 'firebase/storage'; // Import uploadBytes here

const SoMePost = () => {

    // Function to upload images to Firebase Storage
    const handleImageUpload = async (event) => {
        // Get the file and storage references
        const storage = getStorage();
        const files = event.target.files;
        // Check if there are any files
        if (!files.length) return;

        try {
            // Upload all the images to Firebase Storage and get their download URLs
            const imagePromises = Array.from(files).map(async (file) => {
                const imageRef = storageRef(storage, `some/${Date.now()}_${file.name}`);
                await uploadBytes(imageRef, file); // Use uploadBytes function here
                return getDownloadURL(imageRef);
            });
            // Wait for all the image uploads to complete
            const imageUrls = await Promise.all(imagePromises);
            console.log('Images uploaded to storage:', imageUrls);
        } catch (error) {
            console.error('Error uploading the images:', error);
        }
    };

    // Function to delete an image from Firebase Storage
    const deleteImage = async (imageUrl, callback) => {
        try {
            // Delete the image from Firestore
            const storage = getStorage();
            const imageRef = storageRef(storage, imageUrl);

            // Attempt to delete the image from storage
            await deleteObject(imageRef);

            console.log('Image deleted from storage!');
            // Invoke the callback function passed from the Vue component
            callback(imageUrl);
        } catch (error) {
            console.error('Error deleting the image:', error);
        }
    };

    const downloadImage = async (imageUrl) => {
        const storage = getStorage();
        const imageRef = storageRef(storage, imageUrl);
        try {
            // Get the download URL for the specified image reference
            const downloadUrl = await getDownloadURL(imageRef);
            return downloadUrl;
        } catch (error) {
            console.error('Error downloading image:', error);
            return null;
        }
    };






    // Function to get all images from Firebase Storage in a directory
    const getImagesFromStorage = async () => {
        const storage = getStorage();
        const imagesRef = storageRef(storage, 'some/');
        try {
            const result = await listAll(imagesRef);
            const downloadURLs = await Promise.all(result.items.map((item) => getDownloadURL(item)));
            return downloadURLs;
        } catch (error) {
            console.error('Error getting images from storage:', error);
            return [];
        }
    };

    return {
        deleteImage,
        handleImageUpload,
        getImagesFromStorage,
        downloadImage
    };
};

export default SoMePost;
