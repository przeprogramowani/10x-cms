<!-- 040cbddc-6f9a-4d3f-84f9-d55367fc117d 0ac9a75a-1fa2-4240-a452-53f3f99d8b17 -->
# DDD Content Studio Implementation

## Overview

Implement the Content Studio Bounded Context from the strategic analysis using tactical DDD patterns. This will create a new content authoring system alongside (eventually replacing) the existing collections/items modules.

## Architecture

### Directory Structure

```
src/modules/content-studio/
├── domain/
│   ├── aggregates/
│   │   ├── ContentModel.ts        # Content type definitions (BlogPost, Product, etc.)
│   │   └── ContentItem.ts         # Content instances with revisions
│   ├── entities/
│   │   ├── Revision.ts            # Version history entity
│   │   └── Component.ts           # Reusable content components
│   ├── value-objects/
│   │   ├── ContentStatus.ts       # Draft/Published/Archived states
│   │   ├── FieldDefinition.ts     # Schema field specs
│   │   ├── ContentItemId.ts       # Typed identifiers
│   │   └── ContentModelId.ts
│   └── repositories/
│       ├── IContentModelRepository.ts    # Port (interface)
│       └── IContentItemRepository.ts     # Port (interface)
├── application/
│   ├── services/
│   │   ├── ContentModelService.ts        # Use cases for models
│   │   └── ContentItemService.ts         # Use cases for content
│   └── dto/
│       └── ContentDTOs.ts                # Data transfer objects
├── infrastructure/
│   ├── persistence/
│   │   ├── KnexContentModelRepository.ts # Adapter (implementation)
│   │   └── KnexContentItemRepository.ts  # Adapter (implementation)
│   └── http/
│       ├── content-studio.routes.ts      # Auth-protected routes
│       ├── content-studio.api.ts         # Public API routes
│       └── content-studio.views.ts       # HTML rendering
└── index.ts                              # Module exports
```

## Implementation Steps

### 1. Domain Layer - Value Objects

Create immutable value objects that encapsulate domain concepts and validation:

**`src/modules/content-studio/domain/value-objects/ContentModelId.ts`**

- UUID-based identifier with validation
- Factory method for generation
- Equality comparison

**`src/modules/content-studio/domain/value-objects/ContentItemId.ts`**

- Similar to ContentModelId but for content instances

**`src/modules/content-studio/domain/value-objects/ContentStatus.ts`**

- Enum-based: DRAFT, PUBLISHED, ARCHIVED, READY_FOR_REVIEW
- Validation for state transitions (Draft → ReadyForReview → Published)

**`src/modules/content-studio/domain/value-objects/FieldDefinition.ts`**

- fieldName, fieldType (string, text, number, date, richtext, boolean)
- required, defaultValue, validation rules
- Immutable structure

### 2. Domain Layer - Entities

Create entities that have identity and lifecycle within aggregates:

**`src/modules/content-studio/domain/entities/Revision.ts`**

- revisionId, revisionNumber, contentData (JSON)
- createdAt, createdBy
- comment (what changed)
- Cannot exist outside ContentItem aggregate

**`src/modules/content-studio/domain/entities/Component.ts`**

- componentId, componentType, componentData
- For future reusable UI components

### 3. Domain Layer - Aggregates (Core Domain Logic)

**`src/modules/content-studio/domain/aggregates/ContentModel.ts`**

- Aggregate Root: Defines structure for content types
- Properties: contentModelId, name, description, fields (FieldDefinition[])
- Methods:
  - `static create(name, description, fields)` - Factory
  - `addField(fieldDefinition)` - Add field with validation
  - `removeField(fieldName)` - Remove field
  - `updateField(fieldName, updates)` - Modify field definition
  - `validateContentData(data)` - Validate content against schema
- Invariants: Cannot have duplicate field names, minimum 1 field required

**`src/modules/content-studio/domain/aggregates/ContentItem.ts`**

- Aggregate Root: Content instances with versioning
- Properties: contentItemId, contentModelId, currentData, revisions[], status, createdBy, updatedBy, metadata
- Methods:
  - `static create(contentModelId, initialData, createdBy)` - Factory
  - `updateContent(newData, updatedBy)` - Create new revision
  - `changeStatus(newStatus)` - State transition with validation
  - `getCurrentRevision()` - Get latest version
  - `getRevision(revisionNumber)` - Get specific version
  - `revertToRevision(revisionNumber)` - Restore old version
- Invariants: Must belong to valid ContentModel, status transitions follow rules, data matches model schema

### 4. Domain Layer - Repository Interfaces (Ports)

**`src/modules/content-studio/domain/repositories/IContentModelRepository.ts`**

```typescript
interface IContentModelRepository {
  save(contentModel: ContentModel): Promise<void>
  findById(id: ContentModelId): Promise<ContentModel | null>
  findAll(): Promise<ContentModel[]>
  delete(id: ContentModelId): Promise<boolean>
}
```

**`src/modules/content-studio/domain/repositories/IContentItemRepository.ts`**

```typescript
interface IContentItemRepository {
  save(contentItem: ContentItem): Promise<void>
  findById(id: ContentItemId): Promise<ContentItem | null>
  findByModelId(modelId: ContentModelId): Promise<ContentItem[]>
  findByStatus(status: ContentStatus): Promise<ContentItem[]>
  delete(id: ContentItemId): Promise<boolean>
}
```

### 5. Application Layer - Services (Use Cases)

**`src/modules/content-studio/application/services/ContentModelService.ts`**

- Orchestrates use cases, depends on repository interfaces
- Methods:
  - `createContentModel(name, description, fields)` - Create new model
  - `getAllContentModels()` - List all models
  - `getContentModelById(id)` - Get single model
  - `updateContentModel(id, updates)` - Modify model
  - `deleteContentModel(id)` - Remove model (check no content items exist)
  - `validateContentAgainstModel(modelId, data)` - Validate data

**`src/modules/content-studio/application/services/ContentItemService.ts`**

- Methods:
  - `createContentItem(modelId, data, createdBy)` - New content
  - `updateContentItem(itemId, data, updatedBy)` - Edit content
  - `getContentItemById(itemId)` - Fetch item
  - `getContentItemsByModel(modelId)` - List by type
  - `changeContentItemStatus(itemId, newStatus)` - Change state
  - `getContentItemRevisions(itemId)` - History
  - `revertContentItem(itemId, revisionNumber)` - Rollback
  - `deleteContentItem(itemId)` - Remove

### 6. Infrastructure Layer - Persistence (Adapters)

**Database Migration:** `src/db/migrations/YYYYMMDD_content_studio_schema.js`

```sql
-- content_models table
- id (PK), name, description, fields (JSON), created_at, updated_at

-- content_items table  
- id (PK), content_model_id (FK), current_data (JSON), status, created_by, updated_by, metadata (JSON), created_at, updated_at

-- content_revisions table
- id (PK), content_item_id (FK), revision_number, revision_data (JSON), comment, created_by, created_at
```

**`src/modules/content-studio/infrastructure/persistence/KnexContentModelRepository.ts`**

- Implements IContentModelRepository
- Maps between domain objects (ContentModel) and database rows
- Handles JSON serialization for fields

**`src/modules/content-studio/infrastructure/persistence/KnexContentItemRepository.ts`**

- Implements IContentItemRepository
- Maps ContentItem + Revisions (joins tables)
- Handles complex aggregate reconstruction

### 7. Infrastructure Layer - HTTP Interface

**`src/modules/content-studio/infrastructure/http/content-studio.routes.ts`**

Auth-protected routes:

- POST `/api/content-studio/models` - Create model
- PUT `/api/content-studio/models/:id` - Update model
- DELETE `/api/content-studio/models/:id` - Delete model
- POST `/api/content-studio/content` - Create content
- PUT `/api/content-studio/content/:id` - Update content
- PUT `/api/content-studio/content/:id/status` - Change status
- DELETE `/api/content-studio/content/:id` - Delete content

**`src/modules/content-studio/infrastructure/http/content-studio.api.ts`**

Public API routes:

- GET `/api/content-studio/models` - List models
- GET `/api/content-studio/models/:id` - Get model
- GET `/api/content-studio/content` - List published content
- GET `/api/content-studio/content/:id` - Get content item
- GET `/api/content-studio/content/:id/revisions` - Get history

**`src/modules/content-studio/infrastructure/http/content-studio.views.ts`**

- `renderContentStudioPage(req, res)` - Main content authoring interface
- Shows: List of content models, content items, creation/editing forms

### 8. User Interface

**`src/pages/content-studio.html`**

- Two-column layout:
  - Left: Content Models list (like types/schemas)
  - Right: Content Items for selected model
- Create Model modal with field builder
- Create/Edit Content modal with dynamic form based on model
- Show content status badges (Draft/Published/etc.)
- Revision history viewer

**`public/js/modules/content-studio.js`**

- Client-side JavaScript for interactions
- Dynamic form generation based on model fields
- AJAX calls to API endpoints

### 9. Integration

**Update `index.ts`:**

- Import content-studio routes
- Mount routes: `app.use('/api/content-studio', contentStudioApi)`
- Mount auth routes: `app.use('/api/content-studio', requireAuth, contentStudioRoutes)`
- Add view route: `app.get('/content-studio', requireAuth, contentStudioViews.renderContentStudioPage)`

**Update navigation (`src/components/topbar.html`):**

- Add "Content Studio" link to navigation menu

## Key DDD Patterns Applied

1. **Ubiquitous Language**: ContentModel, ContentItem, Revision, Draft, Component (from strategy doc)
2. **Aggregates**: ContentModel and ContentItem as aggregate roots with clear boundaries
3. **Entities**: Revision has identity within ContentItem aggregate
4. **Value Objects**: ContentStatus, FieldDefinition, IDs (immutable, validated)
5. **Repositories**: Abstract persistence behind interfaces (hexagonal architecture)
6. **Application Services**: Orchestrate use cases, transaction boundaries
7. **Layered Architecture**: Domain → Application → Infrastructure separation
8. **Factory Methods**: `static create()` methods on aggregates for construction

## Success Criteria

- Can create content models (like "BlogPost" with title, body, author fields)
- Can create content items based on models
- Content items track revisions automatically on update
- Status transitions work (Draft → Published)
- Can view revision history and revert to previous versions
- Old collections/items modules still work (backward compatible)
- New /content-studio page accessible and functional

### To-dos

- [ ] Create domain value objects (ContentModelId, ContentItemId, ContentStatus, FieldDefinition)
- [ ] Create domain entities (Revision, Component)
- [ ] Create aggregate roots (ContentModel, ContentItem) with business logic and invariants
- [ ] Define repository interfaces (IContentModelRepository, IContentItemRepository)
- [ ] Create database migration for content_models, content_items, and content_revisions tables
- [ ] Implement Knex-based repositories (KnexContentModelRepository, KnexContentItemRepository)
- [ ] Create DTOs for application layer data transfer
- [ ] Create application services (ContentModelService, ContentItemService) with use cases
- [ ] Create HTTP routes (content-studio.routes.ts for auth, content-studio.api.ts for public)
- [ ] Create content-studio.html page with two-column layout for models and content
- [ ] Create client-side JavaScript (content-studio.js) for dynamic forms and interactions
- [ ] Create content-studio.views.ts for server-side HTML rendering
- [ ] Integrate Content Studio into main app (index.ts) and add navigation link