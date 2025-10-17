# JavaScript Module Structure

This directory contains the refactored, modular JavaScript code for the 10x-CMS application.

## Architecture Overview

The codebase has been refactored from a single monolithic `app.js` file (1387 lines) into a clean, modular architecture following separation of concerns principles.

### Directory Structure

```
public/js/
├── app.js                    # Main entry point
├── core/                     # Core functionality modules
│   ├── alerts.js            # Alert system
│   ├── navigation.js        # Navigation and tooltips
│   └── utils.js             # Utility functions
└── modules/                  # Feature-specific modules
    ├── collections.js       # Collections page logic
    ├── items.js             # Items/collection detail page logic
    ├── media.js             # Media library page logic
    └── webhooks.js          # Webhooks page logic
```

## Module Descriptions

### Core Modules

#### `core/alerts.js`
Handles the global alert/notification system.
- **Exports**: `window.AlertSystem`
- **Key Functions**:
  - `init()` - Initialize alert container
  - `show(message, type)` - Display alert message
- **Backward Compatibility**: `window.showGlobalAlert()` still available

#### `core/navigation.js`
Manages navigation highlighting and Bootstrap tooltips.
- **Exports**: `window.Navigation`
- **Key Functions**:
  - `init()` - Highlight active nav items
  - `initTooltips()` - Initialize Bootstrap tooltips

#### `core/utils.js`
Common utility functions used across the application.
- **Exports**: `window.Utils`
- **Key Functions**:
  - `parseItemData(data)` - Parse item data (string or object)
  - `isMediaPath(value)` - Check if value is a media path
  - `getTableHeaders($table)` - Extract table headers
  - `getCollectionIdFromMeta()` - Extract collection ID from meta tag
  - `toggleLoader(show)` - Show/hide loading indicator
  - `shouldAutoOpenModal(actionName)` - Check URL params for auto-open

### Feature Modules

#### `modules/collections.js`
Handles the collections listing page functionality.
- **Exports**: `window.CollectionsModule`
- **Responsibilities**:
  - Creating new collections
  - Deleting collections
  - Managing collection schema fields (sortable, add/remove)
  - Dynamic DOM updates

#### `modules/items.js`
Manages the collection detail page and item CRUD operations.
- **Exports**: `window.ItemsModule`
- **Responsibilities**:
  - Adding new items to collections
  - Editing existing items
  - Deleting items
  - Media selector integration
  - Real-time table updates (no page refresh needed)

#### `modules/media.js`
Handles the media library page functionality.
- **Exports**: `window.MediaModule`
- **Responsibilities**:
  - Uploading images
  - Previewing images
  - Deleting images
  - Copying image URLs

#### `modules/webhooks.js`
Manages webhook creation and deletion.
- **Exports**: `window.WebhooksModule`
- **Responsibilities**:
  - Creating webhooks with event selection
  - Deleting webhooks
  - Form validation

### Main Entry Point

#### `app.js`
Orchestrates all modules and initializes the appropriate functionality based on the current page.
- **Initialization Flow**:
  1. Initialize core modules (alerts, navigation, tooltips)
  2. Detect current page from URL
  3. Initialize page-specific module
- **Route Detection**:
  - `/collections` → CollectionsModule
  - `/collections/:id` → ItemsModule
  - `/media` → MediaModule
  - `/webhooks` → WebhooksModule

## Benefits of This Architecture

### 1. Modularity
Each module has a single, well-defined responsibility, making the code easier to understand and maintain.

### 2. Reusability
Core utilities and functions can be easily reused across different modules.

### 3. Testability
Individual modules can be tested in isolation, making unit testing much easier.

### 4. Maintainability
- Smaller files are easier to navigate and understand
- Changes to one feature don't affect others
- Clear separation of concerns

### 5. Scalability
New features can be added as new modules without touching existing code.

### 6. Performance
Only the necessary code for each page is initialized, reducing unnecessary execution.

### 7. Code Quality
- Better organization
- Reduced code duplication
- Consistent patterns across modules
- Clear naming conventions

## Loading Order

The modules are loaded in a specific order in `base.html`:

1. **jQuery and Bootstrap** (dependencies)
2. **Core modules** (alerts, navigation, utils)
3. **Feature modules** (collections, items, media, webhooks)
4. **Main app** (initialization)

This ensures all dependencies are available when needed.

## Development Guidelines

### Adding a New Module

1. Create a new file in `modules/` (e.g., `modules/newfeature.js`)
2. Follow the existing pattern:
   ```javascript
   (function (window) {
     "use strict";

     function init() {
       // Initialize functionality
     }

     // Export to window
     window.NewFeatureModule = {
       init: init
     };
   })(window);
   ```
3. Add the script tag to `src/layout/base.html`
4. Add initialization logic to `app.js`

### Module Best Practices

- Use IIFE pattern to avoid polluting global scope
- Export only necessary functions
- Cache DOM elements at module initialization
- Use meaningful function and variable names
- Add comments for complex logic
- Handle errors gracefully
- Validate user input

### Backward Compatibility

Some global functions are maintained for backward compatibility:
- `window.showGlobalAlert()` → `AlertSystem.show()`

These can be gradually phased out if needed.

## Migration Notes

The original monolithic `app.js` has been backed up as `app.js.backup` for reference. All functionality has been preserved and enhanced in the new modular structure.

### Key Improvements in Refactoring

1. **Fixed item update bug**: Items now re-render immediately after updates without requiring page refresh
2. **Improved data parsing**: Safer handling of JSON data from backend
3. **Better field ordering**: Table updates maintain correct column order
4. **Type safety**: More robust type checking and conversion
5. **Error handling**: Better error messages and graceful degradation

## Testing

To test the refactored code:
1. Build the TypeScript: `npm run build`
2. Start the server: `npm start`
3. Test each page:
   - Collections listing (create, delete)
   - Collection detail (add, edit, delete items)
   - Media library (upload, preview, delete)
   - Webhooks (create, delete)

## Future Enhancements

Potential improvements for future iterations:
- Migrate to TypeScript for better type safety
- Add ES6 modules (import/export) if dropping IE11 support
- Implement a build system for minification
- Add unit tests for each module
- Consider a modern framework (React, Vue) for more complex features
