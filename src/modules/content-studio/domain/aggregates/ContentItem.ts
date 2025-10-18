import {ContentItemId} from "../value-objects/ContentItemId.js";
import {ContentModelId} from "../value-objects/ContentModelId.js";
import {ContentStatus} from "../value-objects/ContentStatus.js";
import {Revision, RevisionData, RevisionProps} from "../entities/Revision.js";

/**
 * Aggregate Root: ContentItem
 * Represents an instance of content (e.g., a specific blog post, product)
 * Manages its own revisions and enforces status transition rules
 */

export interface ContentItemMetadata {
  [key: string]: any;
}

export interface ContentItemProps {
  contentItemId: ContentItemId;
  contentModelId: ContentModelId;
  currentData: RevisionData;
  revisions: Revision[];
  status: ContentStatus;
  createdBy: string;
  updatedBy: string;
  metadata: ContentItemMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentItem {
  private props: ContentItemProps;

  private constructor(props: ContentItemProps) {
    this.props = props;
  }

  /**
   * Factory method to create a new ContentItem
   */
  static create(
    contentModelId: ContentModelId,
    initialData: RevisionData,
    createdBy: string,
    metadata: ContentItemMetadata = {}
  ): ContentItem {
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error("createdBy is required");
    }

    const now = new Date();

    // Create initial revision
    const initialRevision = Revision.create(
      1,
      initialData,
      createdBy,
      "Initial creation"
    );

    return new ContentItem({
      contentItemId: ContentItemId.generate(),
      contentModelId,
      currentData: {...initialData},
      revisions: [initialRevision],
      status: ContentStatus.draft(),
      createdBy,
      updatedBy: createdBy,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute an existing ContentItem from persistence
   */
  static reconstitute(
    id: string,
    contentModelId: string,
    currentData: RevisionData,
    revisions: RevisionProps[],
    status: string,
    createdBy: string,
    updatedBy: string,
    metadata: ContentItemMetadata,
    createdAt: Date,
    updatedAt: Date
  ): ContentItem {
    return new ContentItem({
      contentItemId: ContentItemId.fromString(id),
      contentModelId: ContentModelId.fromString(contentModelId),
      currentData,
      revisions: revisions.map((r) => Revision.reconstitute(r)),
      status: ContentStatus.fromString(status),
      createdBy,
      updatedBy,
      metadata,
      createdAt,
      updatedAt,
    });
  }

  get id(): ContentItemId {
    return this.props.contentItemId;
  }

  get contentModelId(): ContentModelId {
    return this.props.contentModelId;
  }

  get currentData(): RevisionData {
    return {...this.props.currentData};
  }

  get status(): ContentStatus {
    return this.props.status;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get updatedBy(): string {
    return this.props.updatedBy;
  }

  get metadata(): ContentItemMetadata {
    return {...this.props.metadata};
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get revisions(): Revision[] {
    return [...this.props.revisions];
  }

  /**
   * Update the content data, creating a new revision
   */
  updateContent(
    newData: RevisionData,
    updatedBy: string,
    comment?: string
  ): void {
    if (!updatedBy || updatedBy.trim().length === 0) {
      throw new Error("updatedBy is required");
    }

    // Create new revision
    const nextRevisionNumber = this.props.revisions.length + 1;
    const newRevision = Revision.create(
      nextRevisionNumber,
      newData,
      updatedBy,
      comment
    );

    this.props.revisions.push(newRevision);
    this.props.currentData = {...newData};
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Change the status of the content item
   * Validates the transition according to business rules
   */
  changeStatus(newStatus: ContentStatus): void {
    if (this.props.status.equals(newStatus)) {
      return; // No change needed
    }

    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this.props.status.toString()} to ${newStatus.toString()}`
      );
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  /**
   * Get the current (latest) revision
   */
  getCurrentRevision(): Revision {
    if (this.props.revisions.length === 0) {
      throw new Error("ContentItem has no revisions");
    }
    const latestRevision =
      this.props.revisions[this.props.revisions.length - 1];
    if (!latestRevision) {
      throw new Error("Failed to retrieve latest revision");
    }
    return latestRevision;
  }

  /**
   * Get a specific revision by number
   */
  getRevision(revisionNumber: number): Revision | undefined {
    return this.props.revisions.find(
      (r) => r.revisionNumber === revisionNumber
    );
  }

  /**
   * Revert content to a previous revision
   */
  revertToRevision(revisionNumber: number, revertedBy: string): void {
    const targetRevision = this.getRevision(revisionNumber);

    if (!targetRevision) {
      throw new Error(`Revision ${revisionNumber} not found`);
    }

    const comment = `Reverted to revision ${revisionNumber}`;
    const revisionData = targetRevision.contentData;
    this.updateContent(revisionData, revertedBy, comment);
  }

  /**
   * Update metadata
   */
  updateMetadata(newMetadata: ContentItemMetadata): void {
    this.props.metadata = {...this.props.metadata, ...newMetadata};
    this.props.updatedAt = new Date();
  }

  /**
   * Get total number of revisions
   */
  getRevisionCount(): number {
    return this.props.revisions.length;
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): {
    id: string;
    contentModelId: string;
    currentData: RevisionData;
    revisions: RevisionProps[];
    status: string;
    createdBy: string;
    updatedBy: string;
    metadata: ContentItemMetadata;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.props.contentItemId.toString(),
      contentModelId: this.props.contentModelId.toString(),
      currentData: {...this.props.currentData},
      revisions: this.props.revisions.map((r) => r.toObject()),
      status: this.props.status.toString(),
      createdBy: this.props.createdBy,
      updatedBy: this.props.updatedBy,
      metadata: {...this.props.metadata},
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
