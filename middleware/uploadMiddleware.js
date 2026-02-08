import multer from "multer";
import path from "path";

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png/;
  const isValid = allowed.test(file.mimetype);

  if (isValid) cb(null, true);
  else cb(new Error("Only images allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
});