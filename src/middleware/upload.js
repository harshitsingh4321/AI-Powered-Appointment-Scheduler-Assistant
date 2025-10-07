import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = (process.env.ALLOWED_MIME || "image/jpeg,image/png,image/jpg,image/bmp").split(",");
  if (!allowed.length || allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter,
});

export default upload.single("file"); // field name must be "file"
