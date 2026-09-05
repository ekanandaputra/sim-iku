import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  // Add file filter if only specific types are allowed (optional)
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default limit
  },
});

function buildTimestampedFilename(originalname: string): string {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datetime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${base}_${datetime}${ext}`;
}

// Guide materials are saved as <original_file_name>_<currentdatetime>.<ext>
const guideStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, buildTimestampedFilename(file.originalname));
  },
});

export const guideUpload = multer({
  storage: guideStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default limit
  },
});
