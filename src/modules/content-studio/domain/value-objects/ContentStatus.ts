/**
 * Value Object: ContentStatus
 * Represents the lifecycle state of a Content Item
 * Enforces valid state transitions according to the ubiquitous language
 */
export enum ContentStatusType {
  DRAFT = "DRAFT",
  READY_FOR_REVIEW = "READY_FOR_REVIEW",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export class ContentStatus {
  private readonly status: ContentStatusType;

  private constructor(status: ContentStatusType) {
    this.status = status;
  }

  static draft(): ContentStatus {
    return new ContentStatus(ContentStatusType.DRAFT);
  }

  static readyForReview(): ContentStatus {
    return new ContentStatus(ContentStatusType.READY_FOR_REVIEW);
  }

  static published(): ContentStatus {
    return new ContentStatus(ContentStatusType.PUBLISHED);
  }

  static archived(): ContentStatus {
    return new ContentStatus(ContentStatusType.ARCHIVED);
  }

  static fromString(status: string): ContentStatus {
    if (
      !Object.values(ContentStatusType).includes(status as ContentStatusType)
    ) {
      throw new Error(`Invalid content status: ${status}`);
    }
    return new ContentStatus(status as ContentStatusType);
  }

  toString(): string {
    return this.status;
  }

  equals(other: ContentStatus): boolean {
    if (!other) return false;
    return this.status === other.status;
  }

  isDraft(): boolean {
    return this.status === ContentStatusType.DRAFT;
  }

  isReadyForReview(): boolean {
    return this.status === ContentStatusType.READY_FOR_REVIEW;
  }

  isPublished(): boolean {
    return this.status === ContentStatusType.PUBLISHED;
  }

  isArchived(): boolean {
    return this.status === ContentStatusType.ARCHIVED;
  }

  /**
   * Validates if a transition to the new status is allowed
   * Business Rules (from Editorial Workflow & Governance):
   * - DRAFT → READY_FOR_REVIEW, PUBLISHED, ARCHIVED
   * - READY_FOR_REVIEW → DRAFT (changes requested), PUBLISHED
   * - PUBLISHED → ARCHIVED
   * - ARCHIVED → DRAFT (restore)
   */
  canTransitionTo(newStatus: ContentStatus): boolean {
    const currentState = this.status;
    const newState = newStatus.status;

    const allowedTransitions: Record<ContentStatusType, ContentStatusType[]> = {
      [ContentStatusType.DRAFT]: [
        ContentStatusType.READY_FOR_REVIEW,
        ContentStatusType.PUBLISHED,
        ContentStatusType.ARCHIVED,
      ],
      [ContentStatusType.READY_FOR_REVIEW]: [
        ContentStatusType.DRAFT,
        ContentStatusType.PUBLISHED,
      ],
      [ContentStatusType.PUBLISHED]: [ContentStatusType.ARCHIVED],
      [ContentStatusType.ARCHIVED]: [ContentStatusType.DRAFT],
    };

    return allowedTransitions[currentState]?.includes(newState) || false;
  }
}
