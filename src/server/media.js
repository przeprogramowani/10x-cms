import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for media storage
const MEDIA_DIR = path.join(process.cwd(), "src/server/data");
const MEDIA_FILE = "media.json";
const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");

// Ensure directories exist
const ensureDirectoriesExist = () => {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, {recursive: true});
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, {recursive: true});
  }
};

// Get full path for media data file
const getMediaFilePath = () => {
  return path.join(MEDIA_DIR, MEDIA_FILE);
};

// Get all media items
const getAllMedia = () => {
  ensureDirectoriesExist();

  const mediaPath = getMediaFilePath();

  if (!fs.existsSync(mediaPath)) {
    // Initialize with empty array if file doesn't exist
    fs.writeFileSync(mediaPath, JSON.stringify([], null, 2));
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(mediaPath, "utf8"));
  } catch (err) {
    console.error("Error reading media data:", err);
    return [];
  }
};

// Add a new media item
const addMedia = (file, description) => {
  ensureDirectoriesExist();

  const media = getAllMedia();

  // Create new media item
  const newMedia = {
    id: Date.now().toString(),
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `/uploads/${file.filename}`,
    description: description || "",
    uploadDate: new Date().toISOString(),
  };

  // Add to media array
  media.push(newMedia);

  // Save updated media data
  fs.writeFileSync(getMediaFilePath(), JSON.stringify(media, null, 2));

  return newMedia;
};

// Delete a media item
const deleteMedia = (id) => {
  const media = getAllMedia();
  const mediaIndex = media.findIndex((item) => item.id === id);

  if (mediaIndex === -1) {
    return false;
  }

  const mediaToDelete = media[mediaIndex];
  media.splice(mediaIndex, 1);

  // Delete the file
  try {
    const filePath = path.join(process.cwd(), "public", mediaToDelete.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Error deleting file:", err);
    // Continue even if file deletion fails
  }

  // Save updated media data
  fs.writeFileSync(getMediaFilePath(), JSON.stringify(media, null, 2));

  return true;
};

// Get a specific media item by ID
const getMediaById = (id) => {
  const media = getAllMedia();
  return media.find((item) => item.id === id) || null;
};

// Initialize media storage
const initializeMediaStorage = () => {
  ensureDirectoriesExist();

  // Initialize with empty array if file doesn't exist
  const mediaPath = getMediaFilePath();
  if (!fs.existsSync(mediaPath)) {
    fs.writeFileSync(mediaPath, JSON.stringify([], null, 2));
  }
};

export default {
  getAllMedia,
  addMedia,
  deleteMedia,
  getMediaById,
  initializeMediaStorage,
};
