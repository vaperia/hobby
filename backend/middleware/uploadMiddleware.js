const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp/;
  const isValidMime = allowedTypes.test(file.mimetype);

  if (isValidMime) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, and webp files are allowed"));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;