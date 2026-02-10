// middleware/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // make sure this exports a configured cloudinary instance

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // You can make folder dynamic if needed
    return {
      folder: "profile_pictures",           // or "posts", "products" etc.
      // allowed_formats: ["jpg", "jpeg", "png", "webp"], // you can add webp
      // You can also add:
      // public_id: user_\( {req.user.id}_ \){Date.now()},  // very clean naming
      // transformation: [{ width: 500, height: 500, crop: "limit" }],
      // overwrite: true,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, jpeg, png)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // e.g. 5MB limit - very important!
});

export default upload;