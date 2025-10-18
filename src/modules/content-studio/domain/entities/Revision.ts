import {randomUUID} from "crypto";

/**
 * Entity: Revision
 * Represents a historical version of content within a ContentItem aggregate
 * Cannot exist outside of ContentItem - not an aggregate root
 */

export interface RevisionData {
  [key: string]: string | number | boolean | undefined;
}

export interface RevisionProps {
  revisionId: string;
  revisionNumber: number;
  contentData: RevisionData;
  createdAt: Date;
  createdBy: string;
  comment?: string;
}

export class Revision {
  private readonly props: RevisionProps;

  private constructor(props: RevisionProps) {
    this.props = props;
  }

  static create(
    revisionNumber: number,
    contentData: RevisionData,
    createdBy: string,
    comment?: string
  ): Revision {
    if (revisionNumber < 1) {
      throw new Error("Revision number must be positive");
    }

    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error("createdBy is required for a revision");
    }

    return new Revision({
      revisionId: randomUUID(),
      revisionNumber,
      contentData: {...contentData},
      createdAt: new Date(),
      createdBy,
      comment,
    });
  }

  static reconstitute(props: RevisionProps): Revision {
    return new Revision(props);
  }

  get revisionId(): string {
    return this.props.revisionId;
  }

  get revisionNumber(): number {
    return this.props.revisionNumber;
  }

  get contentData(): RevisionData {
    return {...this.props.contentData};
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get comment(): string | undefined {
    return this.props.comment;
  }

  toObject(): RevisionProps {
    return {
      revisionId: this.props.revisionId,
      revisionNumber: this.props.revisionNumber,
      contentData: {...this.props.contentData},
      createdAt: this.props.createdAt,
      createdBy: this.props.createdBy,
      comment: this.props.comment,
    };
  }
}
