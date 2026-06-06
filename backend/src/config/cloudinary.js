import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config'; // Loads the environment variables from your .env file

// Configuration using environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;