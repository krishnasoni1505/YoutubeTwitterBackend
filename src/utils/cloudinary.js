import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            }
        ) //file uploaded on cloudinary
        // console.log("File uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //removes the locally saved temporary file as upload is failed
    }
}

const deleteFromCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
        console.log("Deleted file from cloudinary", result)
    } catch (error) {
        console.log("delete on cloudinary failed", error);
        return error;
    }
};

export {uploadOnCloudinary, deleteFromCloudinary}