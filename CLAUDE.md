# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10xCMS is a modern, lightweight Content Management System built with Node.js and Express. It provides dynamic collection management with custom schemas, media library, webhooks, and a public API for headless CMS functionality.

**Key Features:**
- Dynamic collection creation with custom field schemas
- Media library for image management
- Webhook system for real-time notifications
- Public REST API for headless CMS usage
- Server-side HTML templating system
- SQLite database with Knex.js query builder

## Development Commands

### Running the Application
```bash
npm run dev        # Start development server with nodemon (auto-reload)
npm start          # Start production server
```
The application runs on `http://localhost:3000`.

### Testing
```bash
npm test           # Run unit tests (Mocha + Chai)
npm run test:e2e   # Run E2E tests with Playwright
npm run test:e2e:ui # Run E2E tests with Playwright UI
```

### Dependencies
```bash
npm install        # Install all dependencies (Node.js and frontend)
```
Frontend dependencies (Bootstrap, jQuery, jQuery UI) are managed via npm and served from `node_modules/`.

## Architecture Overview

### Application Entry Point
- **index.js**: Main application file that initializes Express server, configures middleware, defines routes, and starts the server

### Core Server Modules (src/server/)

**storage.js**: Database abstraction layer
- Manages all database operations using Knex.js
- Collections CRUD: `createCollection()`, `getCollections()`, `getCollectionById()`, `updateCollection()`, `deleteCollection()`
- Items CRUD: `addItemToCollection()`, `updateItemInCollection()`, `deleteItemFromCollection()`
- Webhooks CRUD: `getWebhooks()`, `addWebhook()`, `deleteWebhook()`
- Database initialization: `initializeStorage()` runs migrations

**api.js**: Public REST API routes
- Mounted at `/api` prefix
- GET `/api/collections` - List all collections
- GET `/api/collections/:id` - Get single collection
- GET `/api/collections/:id/items` - Get collection items
- GET `/api/collections/:collectionId/items/:itemId` - Get single item
- No authentication required (public API for headless CMS usage)

**webhooks.js**: Webhook notification system
- Triggers HTTP callbacks on collection item changes
- `onItemCreated()`, `onItemUpdated()`, `onItemDeleted()` - Event handlers
- Uses `@10xdevspl/http-client` for HTTP requests
- Webhooks are filtered by event type (create/update/delete)
- Handles webhook failures gracefully with Promise.allSettled

**media.js**: Media library management
- File-based storage using JSON file at `src/server/data/media.json`
- Images stored in `public/uploads/`
- `getAllMedia()`, `addMedia()`, `deleteMedia()`, `getMediaById()`
- `initializeMediaStorage()` ensures directories exist

**templating.js**: Server-side HTML template engine
- Custom template system with meta tags and variable substitution
- Templates located in `src/pages/`, layouts in `src/layout/`, components in `src/components/`
- Meta tag format: `<!-- @title:Page Title -->`, `<!-- @layout:main -->`
- Variable substitution: `{{variableName}}`
- Component injection: `<!-- @inject:componentName -->`
- Conditional rendering: `<!-- @if:variable -->content<!-- @endif -->`
- `renderPage()` is the main entry point for rendering

### Database (src/server/db/)

**connection.js**: Knex database connection
- Exports configured Knex instance
- Environment-based configuration (development/test/production)

**knexfile.js**: Knex configuration
- Development: SQLite at `src/server/db/dev.sqlite3`
- Test: In-memory SQLite (`:memory:`)
- Production: SQLite at `src/server/db/prod.sqlite3`
- Foreign key constraints enabled

**migrations/**: Database schema definitions
- `20240320000000_initial_schema.js` creates three tables:
  - `collections`: id, name, schema (JSON), created_at, updated_at
  - `items`: id, collection_id (FK), data (JSON), created_at, updated_at
  - `webhooks`: id, collection_id (FK), url, events (JSON), created_at, updated_at
- All tables use string IDs (timestamp-based)
- Cascading deletes configured

### Frontend Structure

**src/pages/**: HTML page templates
- Individual page files (home.html, collections.html, collection.html, media.html, webhooks.html, login.html)

**src/layout/**: Layout templates
- Wraps page content with common structure
- Content injected at `<!-- @content -->`

**src/components/**: Reusable HTML components
- topbar.html, footer.html
- Injected into layouts using `<!-- @inject:componentName -->`

**public/**: Static assets
- `public/uploads/`: User-uploaded media files
- `public/images/`: Application images
- Frontend dependencies (Bootstrap, jQuery, jQuery UI) served from `node_modules/` via Express static middleware

## Key Technical Details

### Authentication
- Simple cookie-based authentication (not for production use)
- Credentials stored in environment variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `requireAuth()` middleware protects routes
- Manual cookie handling implementation (no express-session)
- Login at `/login`, logout at `/logout`

### Collection Schema System
- Collections have dynamic schemas defined as JSON objects
- Schema format: `{"fieldName": "fieldType"}`
- Supported field types: `"string"`, `"text"`, `"number"`, `"date"`, `"media"`
- Item data stored as JSON in database
- Media fields store image URLs from the media library

### File Upload
- Multer middleware handles image uploads
- 5MB file size limit
- Only image MIME types allowed
- Files saved with timestamp-based names to `public/uploads/`

### Environment Configuration
- Uses dotenv for environment variables
- Prefers `.env.development` if it exists, otherwise `.env`
- Required variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- Default development credentials: username=10xadmin, password=10xpassword

## Testing Strategy

### Unit Tests
- Located alongside source files with `.test.js` suffix
- Example: `src/server/templating.test.js`
- Run with Mocha and Chai

### E2E Tests
- Playwright for browser testing
- Commands: `npm run test:e2e`, `npm run test:e2e:ui`

## Common Development Patterns

### Adding a New Collection Field Type
1. Update schema handling in `index.js` (line 298-349) for form field generation
2. Update item display logic in `index.js` (line 370-400) for table rendering
3. Add corresponding frontend JavaScript in page templates if needed

### Adding a New API Endpoint
1. Add route to `src/server/api.js` for public API
2. OR add route to `index.js` for authenticated endpoints
3. Use storage module functions for database operations

### Database Changes
1. Create new migration in `src/server/db/migrations/`
2. Run `npx knex migrate:latest --knexfile src/server/db/knexfile.js`
3. Update storage module functions as needed

### Working with Templates
1. Pages use meta tags: `<!-- @title:Page Title -->`, `<!-- @layout:main -->`
2. Variables replaced with `{{variableName}}` syntax
3. Components injected with `<!-- @inject:componentName -->`
4. Pass variables to `templating.renderPage(pageName, req, variables)`

## Important Notes

- Application uses modern ES modules (ESM) with `import`/`export` syntax
- Frontend dependencies managed via npm (no Bower)
- SQLite database file location depends on NODE_ENV (dev.sqlite3 by default)
- Media metadata stored separately from files (media.json vs public/uploads/)
- Webhook calls are fire-and-forget (errors logged but don't block operations)
- IDs are timestamp strings (Date.now().toString()) not UUIDs or auto-increment
- The templating system is custom-built (not using Express view engines)
