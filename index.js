import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import storageModule from "./src/server/storage.js";
import mediaModule from "./src/server/media.js";
import apiRoutes from "./src/server/api.js";
import webhooksModule from "./src/server/webhooks.js";
import pages from "./src/server/pages.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

if (fs.existsSync(".env.development")) {
  dotenv.config({path: ".env.development"});
} else {
  dotenv.config();
}

const app = express();

app.use(express.static("public"));
app.use("/images", express.static("public/images"));

// Serve frontend dependencies from node_modules
app.use("/vendor/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap")));
app.use("/vendor/jquery", express.static(path.join(__dirname, "node_modules/jquery")));
app.use("/vendor/jquery-ui", express.static(path.join(__dirname, "node_modules/jquery-ui-dist")));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use("/api", apiRoutes);

app.use((req, res, next) => {
  const cookies = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      cookies[parts[0].trim()] = (parts[1] || "").trim();
    });
  }

  req.cookies = cookies;

  res.setCookie = function (name, value, options = {}) {
    let cookieStr = `${name}=${value}`;

    if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
    if (options.path) cookieStr += `; Path=${options.path}`;
    if (options.httpOnly) cookieStr += "; HttpOnly";
    if (options.secure) cookieStr += "; Secure";

    this.setHeader("Set-Cookie", cookieStr);
    return this;
  };

  next();
});

const requireAuth = (req, res, next) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  next();
};

app.get("/webhooks", requireAuth, pages.renderWebhooksPage);

app.post("/api/webhooks", requireAuth, async (req, res) => {
  try {
    const {collection: collectionId, url, events = []} = req.body;

    if (!collectionId || !url || events.length === 0) {
      return res.status(400).json({error: "Missing required fields"});
    }

    // Validate that events only contain allowed values
    const allowedEvents = ["create", "update", "delete"];
    const validEvents = events.every((event) => allowedEvents.includes(event));

    if (!validEvents) {
      return res.status(400).json({error: "Invalid event types provided"});
    }

    const webhook = await storageModule.addWebhook(collectionId, url, events);
    res.json(webhook);
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({error: "Error creating webhook"});
  }
});

app.delete("/api/webhooks/:id", requireAuth, async (req, res) => {
  try {
    const success = await storageModule.deleteWebhook(req.params.id);
    if (success) {
      res.json({success: true});
    } else {
      res.status(404).json({error: "Webhook not found"});
    }
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({error: "Error deleting webhook"});
  }
});

app.get("/collections", requireAuth, pages.renderCollectionsPage);

app.get("/collections/:id", requireAuth, pages.renderCollectionPage);

// API routes for collections
app.post("/api/collections", requireAuth, async (req, res) => {
  try {
    const {name, fieldName, fieldType} = req.body;
    const schema = {};

    if (fieldName && fieldType) {
      fieldName.forEach((field, i) => {
        schema[field] = fieldType[i];
      });
    }

    const collection = await storageModule.createCollection(name, schema);
    res.json({success: true, collection});
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({error: "Error creating collection"});
  }
});

app.post("/api/collections/:id/items", requireAuth, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const collection = await storageModule.getCollectionById(collectionId);

    if (!collection) {
      return res.status(404).json({error: "Collection not found"});
    }

    const addedItem = await storageModule.addItemToCollection(
      collectionId,
      req.body
    );

    try {
      await webhooksModule.onItemCreated(collectionId, addedItem);
    } catch (error) {
      console.error("Error calling webhook for item creation:", error);
    }

    res.json({success: true, item: addedItem});
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({error: "Error creating item"});
  }
});

app.put(
  "/api/collections/:collectionId/items/:itemId",
  requireAuth,
  async (req, res) => {
    try {
      const {collectionId, itemId} = req.params;
      const collection = await storageModule.getCollectionById(collectionId);

      if (!collection) {
        return res.status(404).json({error: "Collection not found"});
      }

      const result = await storageModule.updateItemInCollection(
        collectionId,
        itemId,
        req.body
      );

      if (!result) {
        return res.status(404).json({error: "Item not found"});
      }

      try {
        await webhooksModule.onItemUpdated(collectionId, result);
      } catch (error) {
        console.error("Error calling webhook for item update:", error);
      }

      res.json({success: true, item: result});
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({error: "Error updating item"});
    }
  }
);

app.delete(
  "/api/collections/:collectionId/items/:itemId",
  requireAuth,
  async (req, res) => {
    try {
      const {collectionId, itemId} = req.params;

      const success = await storageModule.deleteItemFromCollection(
        collectionId,
        itemId
      );

      if (success) {
        // Wait for webhook but handle errors silently
        try {
          await webhooksModule.onItemDeleted(collectionId, itemId);
        } catch (error) {
          console.error("Error calling webhook for item deletion:", error);
        }

        res.json({success: true, message: "Item deleted successfully"});
      } else {
        res.status(404).json({error: "Collection or item not found"});
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({error: "Error deleting item"});
    }
  }
);

app.delete("/api/collections/:id", requireAuth, async (req, res) => {
  try {
    const {id: collectionId} = req.params;

    if (!collectionId) {
      return res.status(400).json({error: "Collection ID is required"});
    }

    const success = await storageModule.deleteCollection(collectionId);

    if (success) {
      res.json({success: true, message: "Collection deleted successfully"});
    } else {
      res.status(404).json({error: "Collection not found"});
    }
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({error: "Error deleting collection"});
  }
});

// Login routes
app.get("/login", (req, res) => {
  if (req.cookies.auth) {
    return res.redirect("/home");
  }
  pages.renderSimplePage(req, res);
});

app.post("/login", (req, res) => {
  const {username, password} = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.setCookie("auth", "authenticated", {
      maxAge: 3600, // 1 hour
      path: "/",
      httpOnly: true,
    });

    return res.status(200).json({success: true});
  }

  return res.status(401).json({error: "Invalid credentials"});
});

app.get("/logout", (req, res) => {
  res.setCookie("auth", "", {
    maxAge: -1,
    path: "/",
  });

  res.redirect("/login");
});

// Protected routes
app.get("/", requireAuth, pages.renderSimplePage);
app.get("/home", requireAuth, pages.renderSimplePage);

// Media Library routes
app.get("/media", requireAuth, pages.renderMediaPage);

// API routes for media
app.post(
  "/api/media",
  requireAuth,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({error: "No image file uploaded"});
      }

      const description = req.body.description || "";
      const mediaItem = mediaModule.addMedia(req.file, description);

      res.json({success: true, media: mediaItem});
    } catch (err) {
      console.error("Error uploading image:", err);
      res.status(500).json({error: `Error uploading image: ${err.message}`});
    }
  }
);

app.get("/api/media", requireAuth, (req, res) => {
  try {
    const mediaItems = mediaModule.getAllMedia();
    res.json({success: true, media: mediaItems});
  } catch (err) {
    console.error("Error retrieving media:", err);
    res.status(500).json({error: `Error retrieving media: ${err.message}`});
  }
});

app.delete("/api/media/:id", requireAuth, (req, res) => {
  const {id: mediaId} = req.params;

  if (!mediaId) {
    return res.status(400).json({error: "Media ID is required"});
  }

  const success = mediaModule.deleteMedia(mediaId);

  if (success) {
    res.json({success: true, message: "Media deleted successfully"});
  } else {
    res.status(404).json({error: "Media not found or could not be deleted"});
  }
});

// Initialize storage
(async () => {
  try {
    await storageModule.initializeStorage();
    console.log("Database initialized successfully");

    // Initialize media storage
    mediaModule.initializeMediaStorage();

    // Start server
    const server = app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
})();
