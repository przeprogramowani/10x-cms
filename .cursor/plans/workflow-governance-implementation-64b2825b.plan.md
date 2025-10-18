<!-- 64b2825b-e466-45f5-b5c4-4e9804ba042b e29ebdf7-db14-4422-99db-4e325855b49d -->
# Workflow & Governance Bounded Context Implementation

## Overview

Implement the Approval & Governance bounded context from the strategic DDD analysis, integrated with Content Studio via a simple event system. This will enable multi-stage approval workflows with predefined steps, role-based approvals, full audit trails, and governance controls.

## Architecture

### Directory Structure

```
src/modules/workflow-governance/
├── domain/
│   ├── aggregates/
│   │   ├── ApprovalWorkflow.ts        # Workflow definition aggregate
│   │   └── ContentApprovalProcess.ts  # Running approval process aggregate
│   ├── entities/
│   │   ├── ApprovalStage.ts           # Stage within a workflow
│   │   └── ApprovalDecision.ts        # Individual approval/rejection
│   ├── value-objects/
│   │   ├── ApprovalWorkflowId.ts      # Typed identifiers
│   │   ├── ContentApprovalProcessId.ts
│   │   ├── ApprovalStageId.ts
│   │   ├── ApprovalStatus.ts          # Pending/Approved/Rejected/ChangesRequested
│   │   └── ApproverRole.ts            # Role definition (e.g., "Editor", "Legal", "Manager")
│   └── repositories/
│       ├── IApprovalWorkflowRepository.ts
│       └── IContentApprovalProcessRepository.ts
├── application/
│   ├── services/
│   │   ├── ApprovalWorkflowService.ts        # Workflow definition management
│   │   ├── ContentApprovalService.ts         # Approval process orchestration
│   │   └── AuditTrailService.ts              # Query audit history
│   └── dto/
│       └── WorkflowDTOs.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── KnexApprovalWorkflowRepository.ts
│   │   └── KnexContentApprovalProcessRepository.ts
│   ├── http/
│   │   ├── workflow-governance.routes.ts     # Auth-protected routes
│   │   ├── workflow-governance.api.ts        # Public API routes
│   │   └── workflow-governance.views.ts      # HTML rendering
│   └── events/
│       ├── DomainEventBus.ts                 # Simple EventEmitter wrapper
│       ├── ContentStudioEventHandlers.ts     # Listen to Content Studio events
│       └── WorkflowEventHandlers.ts          # Listen to Workflow events
└── index.ts
```

## Domain Model - Ubiquitous Language

From strategic analysis (Section 2.2):

- **Approval Workflow** - Predefined approval path definition (template)
- **Approval Stage** - Sequential step requiring approval from specific role
- **Approver Role** - Named role with approval authority (e.g., "Editor", "Legal", "Product Manager")
- **Approval Status** - State: Pending, Approved, Rejected, ChangesRequested
- **Content Approval Process** - Running instance of a workflow for specific content
- **Audit Trail** - Immutable log of all decisions
- **Review Request** - Formal request triggering workflow
- **Content Freeze** - Lock content during approval process

## Implementation Steps

### Phase 1: Domain Layer - Value Objects

**`domain/value-objects/ApprovalWorkflowId.ts`**

- UUID-based identifier with validation
- Factory method for generation

**`domain/value-objects/ContentApprovalProcessId.ts`**

- Similar to ApprovalWorkflowId but for running processes

**`domain/value-objects/ApprovalStageId.ts`**

- Identifier for stages within workflows

**`domain/value-objects/ApprovalStatus.ts`**

```typescript
enum ApprovalStatusType {
  PENDING = "PENDING",
  APPROVED = "APPROVED", 
  REJECTED = "REJECTED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED"
}
```

- State validation and transition rules
- Methods: `isPending()`, `isApproved()`, `isRejected()`, `isChangesRequested()`

**`domain/value-objects/ApproverRole.ts`**

```typescript
class ApproverRole {
  private readonly roleName: string;
  private readonly description: string;
  
  static create(roleName: string, description?: string): ApproverRole
  equals(other: ApproverRole): boolean
  toString(): string
}
```

- Validates role name (non-empty, alphanumeric + spaces)
- Immutable value object

### Phase 2: Domain Layer - Entities

**`domain/entities/ApprovalStage.ts`**

```typescript
interface ApprovalStageProps {
  stageId: ApprovalStageId;
  stageName: string;
  stageOrder: number;          // Sequential: 1, 2, 3...
  requiredRole: ApproverRole;
  instructions?: string;       // Optional guidance for approvers
}
```

- Entity within ApprovalWorkflow aggregate
- Methods: `getStageId()`, `getRequiredRole()`, `getOrder()`
- Cannot exist outside ApprovalWorkflow

**`domain/entities/ApprovalDecision.ts`**

```typescript
interface ApprovalDecisionProps {
  decisionId: string;
  stageId: ApprovalStageId;
  approverUserId: string;
  approverRole: ApproverRole;
  decision: ApprovalStatus;    // Approved/Rejected/ChangesRequested
  comment?: string;
  timestamp: Date;
}
```

- Entity within ContentApprovalProcess aggregate
- Immutable once created (audit trail requirement)
- Methods: `isApproved()`, `isRejected()`, `requiresChanges()`

### Phase 3: Domain Layer - Aggregates

**`domain/aggregates/ApprovalWorkflow.ts`**

Aggregate Root: Defines reusable workflow templates

```typescript
interface ApprovalWorkflowProps {
  workflowId: ApprovalWorkflowId;
  workflowName: string;
  description: string;
  stages: ApprovalStage[];     // Ordered list of stages
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Key Methods:

- `static create(name, description, createdBy)` - Factory
- `addStage(stageName, requiredRole, instructions?)` - Add stage at end
- `insertStage(position, stageName, requiredRole, instructions?)` - Insert at position
- `removeStage(stageId)` - Remove stage
- `reorderStages(stageId, newPosition)` - Change order
- `deactivate()` - Mark workflow as inactive (cannot use for new processes)
- `activate()` - Reactivate workflow
- `validateStageSequence()` - Ensure valid ordering

Invariants:

- Must have at least 1 stage
- Stage orders must be sequential (1, 2, 3...) with no gaps
- No duplicate role requirements in consecutive stages
- Cannot modify workflow if active processes exist using it

**`domain/aggregates/ContentApprovalProcess.ts`**

Aggregate Root: Running approval process for specific content

```typescript
interface ContentApprovalProcessProps {
  processId: ContentApprovalProcessId;
  workflowId: ApprovalWorkflowId;
  contentItemId: string;        // Reference to Content Studio ContentItem
  currentStageIndex: number;    // Which stage we're on (0-based)
  stages: ApprovalStage[];      // Copied from workflow (immutable snapshot)
  decisions: ApprovalDecision[]; // All approval decisions made
  processStatus: ProcessStatus;  // InProgress, Completed, Rejected, Cancelled
  startedBy: string;
  startedAt: Date;
  completedAt?: Date;
}
```

Key Methods:

- `static initiate(workflowId, workflow, contentItemId, startedBy)` - Factory
- `submitApproval(stageId, approverUserId, approverRole, comment?)` - Approve current stage
- `rejectContent(stageId, approverUserId, approverRole, reason)` - Reject and stop process
- `requestChanges(stageId, approverUserId, approverRole, feedback)` - Request changes
- `getCurrentStage()` - Get current stage requiring approval
- `getNextStage()` - Get next stage (if any)
- `advanceToNextStage()` - Move to next stage after approval
- `complete()` - Mark process as completed (all stages approved)
- `cancel(cancelledBy, reason)` - Cancel process
- `getAuditTrail()` - Get all decisions in chronological order
- `isApprovalAllowedBy(userId, role)` - Check if user can approve current stage

Invariants:

- Content is frozen during process (cannot modify content while approval in progress)
- Must approve stages sequentially (cannot skip)
- Each stage can only be decided once
- Cannot approve after rejection or completion
- User approving must have the required role for current stage

Domain Events Emitted:

- `ApprovalWorkflowStarted`
- `ApprovalStageCompleted`
- `ContentApproved` (all stages complete)
- `ContentRejected`
- `ChangesRequested`
- `ApprovalProcessCancelled`

### Phase 4: Domain Layer - Repository Interfaces

**`domain/repositories/IApprovalWorkflowRepository.ts`**

```typescript
interface IApprovalWorkflowRepository {
  save(workflow: ApprovalWorkflow): Promise<void>
  findById(id: ApprovalWorkflowId): Promise<ApprovalWorkflow | null>
  findAll(): Promise<ApprovalWorkflow[]>
  findActive(): Promise<ApprovalWorkflow[]>
  delete(id: ApprovalWorkflowId): Promise<boolean>
}
```

**`domain/repositories/IContentApprovalProcessRepository.ts`**

```typescript
interface IContentApprovalProcessRepository {
  save(process: ContentApprovalProcess): Promise<void>
  findById(id: ContentApprovalProcessId): Promise<ContentApprovalProcess | null>
  findByContentItemId(contentItemId: string): Promise<ContentApprovalProcess[]>
  findInProgress(): Promise<ContentApprovalProcess[]>
  findPendingApprovalForRole(role: ApproverRole): Promise<ContentApprovalProcess[]>
}
```

### Phase 5: Application Layer - Services

**`application/services/ApprovalWorkflowService.ts`**

Orchestrates workflow definition use cases:

- `createWorkflow(name, description, createdBy)` - Create new workflow template
- `getAllWorkflows()` - List all workflows
- `getActiveWorkflows()` - List only active workflows
- `getWorkflowById(id)` - Get single workflow
- `addStageToWorkflow(workflowId, stageName, requiredRole, instructions?)` - Add stage
- `removeStageFromWorkflow(workflowId, stageId)` - Remove stage
- `reorderWorkflowStages(workflowId, stageId, newPosition)` - Reorder
- `deactivateWorkflow(workflowId)` - Deactivate
- `activateWorkflow(workflowId)` - Activate
- `deleteWorkflow(workflowId)` - Delete (only if no processes)

**`application/services/ContentApprovalService.ts`**

Orchestrates approval process use cases:

- `initiateApprovalProcess(workflowId, contentItemId, initiatedBy)` - Start approval
- `approveCurrentStage(processId, approverUserId, approverRole, comment?)` - Approve
- `rejectContent(processId, approverUserId, approverRole, reason)` - Reject
- `requestChanges(processId, approverUserId, approverRole, feedback)` - Request changes
- `cancelApprovalProcess(processId, cancelledBy, reason)` - Cancel
- `getApprovalProcessById(processId)` - Get process details
- `getApprovalProcessByContentItemId(contentItemId)` - Get process for content
- `getPendingApprovalsForRole(role)` - Get all processes pending approval for role
- `getAllInProgressProcesses()` - Get all active processes

**`application/services/AuditTrailService.ts`**

Query service for audit history:

- `getAuditTrailForContent(contentItemId)` - All decisions for content
- `getAuditTrailForProcess(processId)` - Decisions for specific process
- `getApprovalHistoryByUser(userId)` - All approvals by user
- `getApprovalHistoryByRole(role)` - All approvals by role

### Phase 6: Infrastructure Layer - Persistence

**Database Migration:** `src/db/migrations/YYYYMMDD_workflow_governance_schema.js`

```sql
-- approval_workflows table
CREATE TABLE approval_workflows (
  id VARCHAR(36) PRIMARY KEY,
  workflow_name VARCHAR(255) NOT NULL,
  description TEXT,
  stages JSON NOT NULL,           -- Array of stages with order, role, etc.
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- content_approval_processes table
CREATE TABLE content_approval_processes (
  id VARCHAR(36) PRIMARY KEY,
  workflow_id VARCHAR(36) NOT NULL,
  content_item_id VARCHAR(36) NOT NULL,    -- FK to content_items
  current_stage_index INT NOT NULL,
  stages JSON NOT NULL,                     -- Snapshot of workflow stages
  decisions JSON NOT NULL,                  -- Array of all decisions
  process_status ENUM('IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL,
  started_by VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id),
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  INDEX idx_content_item (content_item_id),
  INDEX idx_process_status (process_status)
);

-- approval_roles table (for UI management)
CREATE TABLE approval_roles (
  role_name VARCHAR(100) PRIMARY KEY,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**`infrastructure/persistence/KnexApprovalWorkflowRepository.ts`**

- Implements `IApprovalWorkflowRepository`
- Maps between domain objects and database rows
- Handles JSON serialization for stages array

**`infrastructure/persistence/KnexContentApprovalProcessRepository.ts`**

- Implements `IContentApprovalProcessRepository`
- Maps ContentApprovalProcess aggregate (complex with decisions)
- Handles complex queries (pending approvals for role)

### Phase 7: Infrastructure Layer - Event System

**`infrastructure/events/DomainEventBus.ts`**

Simple wrapper around Node EventEmitter:

```typescript
class DomainEventBus extends EventEmitter {
  static getInstance(): DomainEventBus
  
  publishContentReadyForReview(event: ContentReadyForReviewEvent): void
  publishApprovalWorkflowStarted(event: ApprovalWorkflowStartedEvent): void
  publishApprovalStageCompleted(event: ApprovalStageCompletedEvent): void
  publishContentApproved(event: ContentApprovedEvent): void
  publishContentRejected(event: ContentRejectedEvent): void
  publishChangesRequested(event: ChangesRequestedEvent): void
  
  onContentReadyForReview(handler: (event) => void): void
  onContentApproved(handler: (event) => void): void
  onContentRejected(handler: (event) => void): void
  onChangesRequested(handler: (event) => void): void
}
```

**Event Interfaces (following strategic doc Section 4.2):**

```typescript
// From Content Studio → Workflow & Governance
interface ContentReadyForReviewEvent {
  itemId: string;
  requestedBy: string;
  reviewType?: string;
  timestamp: Date;
}

// From Workflow & Governance → Content Studio
interface ContentApprovedEvent {
  contentItemId: string;
  processId: string;
  allApprovers: string[];
  finalApprovalTimestamp: Date;
}

interface ContentRejectedEvent {
  contentItemId: string;
  processId: string;
  rejectedBy: string;
  reason: string;
  timestamp: Date;
}

interface ChangesRequestedEvent {
  contentItemId: string;
  processId: string;
  requestedBy: string;
  feedback: string;
  timestamp: Date;
}
```

**`infrastructure/events/ContentStudioEventHandlers.ts`**

Listens to Content Studio events:

```typescript
class ContentStudioEventHandlers {
  constructor(
    private eventBus: DomainEventBus,
    private approvalService: ContentApprovalService
  )
  
  // When content moves to READY_FOR_REVIEW status
  async handleContentReadyForReview(event: ContentReadyForReviewEvent): Promise<void> {
    // Get default or applicable workflow
    // Initiate approval process
    // Emit ApprovalWorkflowStarted event
  }
}
```

**`infrastructure/events/WorkflowEventHandlers.ts`**

Emit events back to Content Studio:

```typescript
class WorkflowEventHandlers {
  constructor(private eventBus: DomainEventBus)
  
  // After all stages approved
  emitContentApproved(process: ContentApprovalProcess): void
  
  // After rejection
  emitContentRejected(process: ContentApprovalProcess, decision: ApprovalDecision): void
  
  // After changes requested
  emitChangesRequested(process: ContentApprovalProcess, decision: ApprovalDecision): void
}
```

### Phase 8: Content Studio Integration

**Modify `src/modules/content-studio/application/services/ContentItemService.ts`**

Add event emission when status changes to READY_FOR_REVIEW:

```typescript
async changeContentItemStatus(itemId: string, newStatus: string): Promise<void> {
  // ... existing logic ...
  
  // After successful status change
  if (newStatus === 'READY_FOR_REVIEW') {
    DomainEventBus.getInstance().publishContentReadyForReview({
      itemId: item.getContentItemId().toString(),
      requestedBy: item.getUpdatedBy(),
      timestamp: new Date()
    });
  }
}
```

Add listener for approval events to update content status:

```typescript
// In initialization
DomainEventBus.getInstance().onContentApproved(async (event) => {
  // Change content status to PUBLISHED
  await contentItemService.changeContentItemStatus(event.contentItemId, 'PUBLISHED');
});

DomainEventBus.getInstance().onContentRejected(async (event) => {
  // Change content status back to DRAFT
  await contentItemService.changeContentItemStatus(event.contentItemId, 'DRAFT');
});

DomainEventBus.getInstance().onChangesRequested(async (event) => {
  // Change content status back to DRAFT
  await contentItemService.changeContentItemStatus(event.contentItemId, 'DRAFT');
});
```

### Phase 9: Infrastructure Layer - HTTP Interface

**`infrastructure/http/workflow-governance.routes.ts`**

Auth-protected routes for workflow management:

```
POST   /api/workflow-governance/workflows                    - Create workflow
PUT    /api/workflow-governance/workflows/:id                - Update workflow
DELETE /api/workflow-governance/workflows/:id                - Delete workflow
POST   /api/workflow-governance/workflows/:id/stages         - Add stage
DELETE /api/workflow-governance/workflows/:id/stages/:stageId - Remove stage
PUT    /api/workflow-governance/workflows/:id/activate       - Activate
PUT    /api/workflow-governance/workflows/:id/deactivate     - Deactivate

POST   /api/workflow-governance/roles                        - Create role
GET    /api/workflow-governance/roles                        - List roles
DELETE /api/workflow-governance/roles/:roleName              - Delete role

POST   /api/workflow-governance/processes/initiate           - Initiate approval
PUT    /api/workflow-governance/processes/:id/approve        - Approve stage
PUT    /api/workflow-governance/processes/:id/reject         - Reject
PUT    /api/workflow-governance/processes/:id/request-changes - Request changes
PUT    /api/workflow-governance/processes/:id/cancel         - Cancel process
```

**`infrastructure/http/workflow-governance.api.ts`**

Public API routes (read-only):

```
GET /api/workflow-governance/workflows              - List workflows
GET /api/workflow-governance/workflows/:id          - Get workflow
GET /api/workflow-governance/processes/:id          - Get process
GET /api/workflow-governance/processes/content/:contentItemId - Get process by content
GET /api/workflow-governance/processes/pending/:role - Get pending approvals for role
GET /api/workflow-governance/audit/:contentItemId   - Get audit trail
```

**`infrastructure/http/workflow-governance.views.ts`**

- `renderWorkflowManagementPage(req, res)` - Admin page for workflows
- `renderApprovalDashboardPage(req, res)` - Approver dashboard
- `renderAuditTrailPage(req, res)` - Audit history viewer

### Phase 10: User Interface

**`src/pages/workflow-management.html`**

Admin interface for creating/managing workflows:

- List of existing workflows (active/inactive)
- "Create Workflow" button → modal with form
- Workflow detail view:
  - Stages list (ordered, with role requirements)
  - Add/remove/reorder stages
  - Activate/deactivate workflow
- Roles management section:
  - Create new roles
  - List existing roles

**`src/pages/approval-dashboard.html`**

Approver interface:

- "My Pending Approvals" section filtered by user's role
- Each approval card shows:
  - Content item summary
  - Current stage info
  - Workflow progress indicator
  - Action buttons: Approve, Reject, Request Changes
- Approval action modal with comment/feedback textarea
- History of completed approvals

**Client-side JavaScript:**

**`public/js/modules/workflow-management.js`**

- AJAX calls for workflow CRUD
- Dynamic stage builder UI
- Drag-and-drop for reordering stages
- Role selector dropdowns

**`public/js/modules/approval-dashboard.js`**

- Fetch pending approvals
- Submit approval decisions
- Real-time status updates (polling)
- Filter/search approvals

### Phase 11: Integration into Main App

**Update `index.ts`:**

```typescript
// Import workflow-governance modules
import workflowGovernanceApi from "./src/modules/workflow-governance/infrastructure/http/workflow-governance.api.js";
import workflowGovernanceRoutes from "./src/modules/workflow-governance/infrastructure/http/workflow-governance.routes.js";
import workflowGovernanceViews from "./src/modules/workflow-governance/infrastructure/http/workflow-governance.views.js";
import { initializeWorkflowEventHandlers } from "./src/modules/workflow-governance/infrastructure/events/ContentStudioEventHandlers.js";

// Mount routes
app.use("/api/workflow-governance", workflowGovernanceApi);
app.use("/api/workflow-governance", requireAuth, workflowGovernanceRoutes);

// Views
app.get("/workflow-management", requireAuth, workflowGovernanceViews.renderWorkflowManagementPage);
app.get("/approval-dashboard", requireAuth, workflowGovernanceViews.renderApprovalDashboardPage);
app.get("/audit-trail", requireAuth, workflowGovernanceViews.renderAuditTrailPage);

// Initialize event handlers
initializeWorkflowEventHandlers();
```

**Update `src/components/topbar.html`:**

Add navigation links:

- "Workflow Management" (admin)
- "Approval Dashboard" (approvers)
- "Audit Trail" (admin/auditors)

## Key DDD Patterns Applied

1. **Ubiquitous Language**: ApprovalWorkflow, ContentApprovalProcess, ApprovalStage, ApproverRole, ApprovalDecision
2. **Aggregates**: ApprovalWorkflow and ContentApprovalProcess as aggregate roots
3. **Entities**: ApprovalStage, ApprovalDecision with identity within aggregates
4. **Value Objects**: ApprovalStatus, ApproverRole (immutable, validated)
5. **Repository Pattern**: Abstract persistence behind interfaces
6. **Domain Events**: Event-driven integration between bounded contexts
7. **Customer-Supplier Pattern**: Content Studio (upstream) → Workflow & Governance (downstream)
8. **Audit Trail**: Immutable ApprovalDecision entities provide full audit history

## Integration Pattern Summary

```
Content Studio (Upstream) → Event Bus → Workflow & Governance (Downstream)

Flow:
1. User changes ContentItem status to READY_FOR_REVIEW
2. ContentItemService emits ContentReadyForReview event
3. WorkflowGovernance listens, initiates ContentApprovalProcess
4. Approvers review and approve/reject via ApprovalDashboard
5. When all stages complete, WorkflowGovernance emits ContentApproved event
6. ContentStudio listens, changes status to PUBLISHED
```

## Success Criteria

- Can define approval workflows with multiple sequential stages
- Can assign roles to each stage (e.g., Stage 1: Editor, Stage 2: Legal, Stage 3: Manager)
- Can create custom approval roles dynamically
- When ContentItem status changes to READY_FOR_REVIEW, approval process starts automatically
- Approvers with correct role can approve/reject/request changes
- Cannot skip stages (must approve sequentially)
- Content is effectively "frozen" during approval (UI should disable editing)
- Full audit trail visible showing who approved/rejected and when
- When all stages approved, content auto-publishes
- When rejected, content returns to DRAFT with feedback
- Old Content Studio functionality unaffected
- New navigation items for Workflow Management and Approval Dashboard

### To-dos

- [ ] Create domain value objects (ApprovalWorkflowId, ContentApprovalProcessId, ApprovalStageId, ApprovalStatus, ApproverRole)
- [ ] Create domain entities (ApprovalStage, ApprovalDecision) with validation
- [ ] Create aggregate roots (ApprovalWorkflow, ContentApprovalProcess) with business logic and invariants
- [ ] Define repository interfaces (IApprovalWorkflowRepository, IContentApprovalProcessRepository)
- [ ] Create database migration for approval_workflows, content_approval_processes, and approval_roles tables
- [ ] Implement Knex-based repositories (KnexApprovalWorkflowRepository, KnexContentApprovalProcessRepository)
- [ ] Create DomainEventBus wrapper around EventEmitter with domain event types
- [ ] Create event handlers (ContentStudioEventHandlers, WorkflowEventHandlers)
- [ ] Create DTOs for application layer data transfer
- [ ] Create application services (ApprovalWorkflowService, ContentApprovalService, AuditTrailService)
- [ ] Create HTTP routes (workflow-governance.routes.ts for auth, workflow-governance.api.ts for public)
- [ ] Create workflow-governance.views.ts for server-side HTML rendering
- [ ] Create workflow-management.html page and workflow-management.js for admin interface
- [ ] Create approval-dashboard.html page and approval-dashboard.js for approver interface
- [ ] Create audit trail viewer page
- [ ] Modify ContentItemService to emit events and listen to approval events
- [ ] Integrate Workflow & Governance into main app (index.ts) and add navigation links