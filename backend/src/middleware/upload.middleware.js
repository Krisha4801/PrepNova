const multer = require("multer");

// Memory storage keeps uploaded PDF buffer in memory for direct forwarding to FastAPI
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/x-pdf" ||
    file.mimetype === "application/octet-stream" ||
    (file.originalname && file.originalname.toLowerCase().endsWith(".pdf"));

  if (isPdf) {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type. Only PDF documents (.pdf) are supported.");
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = {
  uploadPdf
};
