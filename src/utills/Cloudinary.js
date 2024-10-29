import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const env = process.env;

// Configuration
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const resourse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    console.log("File has uploaded in Cloudinary. url: ", resourse.url);
    return resourse;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error(error);
  }
};

export default uploadOnCloudinary;
