import express, {type Request, type Response, type NextFunction} from "express";
import path from "path";
import {fileURLToPath} from "url";
import mediaModule from "./src/modules/media/media.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";

import storageModule from "./src/modules/storage/storage.js";

import collectionsApi from "./src/modules/collections/collections.api.js";
import itemsApi from "./src/modules/items/items.api.js";
import collectionsViews from "./src/modules/collections/collections.views.js";
import itemsViews from "./src/modules/items/items.views.js";
import collectionsRoutes from "./src/modules/collections/collections.routes.js";
import itemsRoutes from "./src/modules/items/items.routes.js";
import templatingService from "./src/modules/templating/templating.service.js";

// Content Studio (DDD Implementation)
import contentStudioApi from "./src/modules/content-studio/infrastructure/http/content-studio.api.js";
import contentStudioRoutes from "./src/modules/content-studio/infrastructure/http/content-studio.routes.js";
import contentStudioViews from "./src/modules/content-studio/infrastructure/http/content-studio.views.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend Express Request to include cookies
declare global {
  namespace Express {
    interface Request {
      cookies: Record<string, string>;
    }
    interface Response {
      cookie(
        name: string,
        value: string,
        options?: {
          maxAge?: number;
          path?: string;
          httpOnly?: boolean;
          secure?: boolean;
        }
      ): this;
    }
  }
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
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
app.use(
  "/vendor/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap"))
);
app.use(
  "/vendor/jquery",
  express.static(path.join(__dirname, "node_modules/jquery"))
);
app.use(
  "/vendor/jquery-ui",
  express.static(path.join(__dirname, "node_modules/jquery-ui-dist"))
);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Public API routes (no auth required)
app.use("/api/collections", collectionsApi);
app.use("/api/collections", itemsApi);

// Content Studio Public API
app.use("/api/content-studio", contentStudioApi);

app.use((req: Request, res: Response, next: NextFunction) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      const key = parts[0]?.trim();
      const value = parts[1]?.trim() || "";
      if (key) {
        cookies[key] = value;
      }
    });
  }

  req.cookies = cookies;

  res.cookie = function (
    name: string,
    value: string,
    options: {
      maxAge?: number;
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
    } = {}
  ) {
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

const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.cookies["auth"]) {
    res.redirect("/login");
    return;
  }
  next();
};

// Webhook routes
const renderWebhooksPage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let webhooksListHtml = "";
    const collections = await storageModule.getCollections();
    let collectionsDropdownHtml = "";

    if (collections.length === 0) {
      collectionsDropdownHtml =
        '<option value="">No collections available</option>';
    } else {
      collectionsDropdownHtml =
        '<option value="">Select collection...</option>';
      for (const collection of collections) {
        collectionsDropdownHtml += `<option value="${collection.id}">${collection.name}</option>`;
      }

      let hasWebhooks = false;
      for (const collection of collections) {
        const webhooks = await storageModule.getWebhooks(collection.id);

        if (webhooks.length > 0) {
          hasWebhooks = true;
          webhooksListHtml += '<div class="mb-4">';
          webhooksListHtml += `<h6 class="mb-3">${collection.name}</h6>`;

          for (const webhook of webhooks) {
            webhooksListHtml += `
              <div class="card mb-2">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <p class="mb-1"><strong>URL:</strong> ${webhook.url}</p>
                      <p class="mb-0"><small class="text-muted">Events: ${webhook.events.join(
                        ", "
                      )}</small></p>
                    </div>
                    <button class="btn btn-danger btn-sm delete-webhook" data-id="${
                      webhook.id
                    }">Delete</button>
                  </div>
                </div>
              </div>`;
          }

          webhooksListHtml += "</div>";
        }
      }

      if (!hasWebhooks) {
        webhooksListHtml =
          "<p class='alert alert-info text-dark'>No webhooks configured yet.</p>";
      }
    }

    const content = templatingService.renderPage("webhooks", req, {
      webhooksListHtml,
      collectionsDropdownHtml,
    });

    if (!content) {
      res.status(500).send("Error loading template");
      return;
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading webhooks page:", error);
    res.status(500).send("Error loading webhooks");
  }
};

app.get("/webhooks", requireAuth, renderWebhooksPage);

app.post(
  "/api/webhooks",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {collection: collectionId, url, events = []} = req.body;

      if (!collectionId || !url || events.length === 0) {
        res.status(400).json({error: "Missing required fields"});
        return;
      }

      // Validate that events only contain allowed values
      const allowedEvents = ["create", "update", "delete"];
      const validEvents = events.every((event: string) =>
        allowedEvents.includes(event)
      );

      if (!validEvents) {
        res.status(400).json({error: "Invalid event types provided"});
        return;
      }

      const webhook = await storageModule.addWebhook(collectionId, url, events);
      res.json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({error: "Error creating webhook"});
    }
  }
);

app.delete(
  "/api/webhooks/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Webhook ID is required"});
        return;
      }

      const success = await storageModule.deleteWebhook(id);
      if (success) {
        res.json({success: true});
      } else {
        res.status(404).json({error: "Webhook not found"});
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({error: "Error deleting webhook"});
    }
  }
);

// Collections and Items page routes
app.get("/collections", requireAuth, collectionsViews.renderCollectionsPage);
app.get("/collections/:id", requireAuth, itemsViews.renderCollectionPage);

// Content Studio page route
app.get(
  "/content-studio",
  requireAuth,
  contentStudioViews.renderContentStudioPage
);

// Auth-protected API routes for collections and items
app.use("/api/collections", requireAuth, collectionsRoutes);
app.use("/api/collections", requireAuth, itemsRoutes);

// Auth-protected API routes for Content Studio
app.use("/api/content-studio", requireAuth, contentStudioRoutes);

// Simple page rendering helper
const renderSimplePage = (req: Request, res: Response): void => {
  const pageName = req.path === "/" ? "home" : req.path.substring(1);
  const content = templatingService.renderPage(pageName, req);

  if (!content) {
    res.status(500).send("Error loading template");
    return;
  }

  res.send(content);
};

// Login routes
app.get("/login", (req: Request, res: Response) => {
  if (req.cookies["auth"]) {
    return res.redirect("/home");
  }
  renderSimplePage(req, res);
});

app.post("/login", (req: Request, res: Response) => {
  const {username, password} = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.cookie("auth", "authenticated", {
      maxAge: 3600, // 1 hour
      path: "/",
      httpOnly: true,
    });

    return res.status(200).json({success: true});
  }

  return res.status(401).json({error: "Invalid credentials"});
});

app.get("/logout", (_req: Request, res: Response) => {
  res.cookie("auth", "", {
    maxAge: -1,
    path: "/",
  });

  res.redirect("/login");
});

// Protected routes
app.get("/", requireAuth, renderSimplePage);
app.get("/home", requireAuth, renderSimplePage);

// Media Library routes
const renderMediaPage = (req: Request, res: Response): void => {
  const mediaItems = mediaModule.getAllMedia();
  let mediaHtml = "";

  if (mediaItems.length === 0) {
    mediaHtml =
      '<div class="col-12"><p class="alert alert-info text-dark">No images found. Upload your first image to get started.</p></div>';
  } else {
    mediaItems.forEach((item) => {
      mediaHtml += `
        <div class="col-md-3 mb-4">
          <div class="card h-100">
            <img src="${item.path}" class="card-img-top" alt="${
        item.originalname
      }" style="height: 150px; object-fit: cover;">
            <div class="card-body">
              <!-- @mediaId:${item.id} -->
              <h6 class="card-title text-truncate">${item.originalname}</h6>
              <p class="card-text small text-muted">${
                item.description || "No description"
              }</p>
              <div class="d-flex justify-content-between">
                <button class="btn btn-sm btn-primary preview-image-btn"
                  data-id="${item.id}"
                  data-path="${item.path}"
                  data-name="${item.originalname}"
                  data-description="${item.description || ""}">Preview</button>
                <button class="btn btn-sm btn-danger delete-image-btn" data-id="${
                  item.id
                }">Delete</button>
              </div>
            </div>
          </div>
        </div>`;
    });
  }

  const variables = {
    mediaHtml,
  };

  const content = templatingService.renderPage("media", req, variables);

  if (!content) {
    res.status(500).send("Error loading template");
    return;
  }

  res.send(content);
};

app.get("/media", requireAuth, renderMediaPage);

// API routes for media
app.post(
  "/api/media",
  requireAuth,
  upload.single("image"),
  (req: Request, res: Response): void => {
    try {
      if (!req.file) {
        res.status(400).json({error: "No image file uploaded"});
        return;
      }

      const description = req.body.description || "";
      const mediaItem = mediaModule.addMedia(req.file, description);

      res.json({success: true, media: mediaItem});
    } catch (err) {
      console.error("Error uploading image:", err);
      res
        .status(500)
        .json({
          error: `Error uploading image: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        });
    }
  }
);

app.get("/api/media", requireAuth, (_req: Request, res: Response) => {
  try {
    const mediaItems = mediaModule.getAllMedia();
    res.json({success: true, media: mediaItems});
  } catch (err) {
    console.error("Error retrieving media:", err);
    res
      .status(500)
      .json({
        error: `Error retrieving media: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
  }
});

app.delete(
  "/api/media/:id",
  requireAuth,
  (req: Request, res: Response): void => {
    const {id: mediaId} = req.params;

    if (!mediaId) {
      res.status(400).json({error: "Media ID is required"});
      return;
    }

    const success = mediaModule.deleteMedia(mediaId);

    if (success) {
      res.json({success: true, message: "Media deleted successfully"});
    } else {
      res.status(404).json({error: "Media not found or could not be deleted"});
    }
  }
);

// Initialize storage
(async () => {
  try {
    await storageModule.initializeStorage();
    console.log("Database initialized successfully");

    // Initialize media storage
    mediaModule.initializeMediaStorage();

    // Start server
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
})();
