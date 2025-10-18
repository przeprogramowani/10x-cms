import {randomUUID} from "crypto";

/**
 * Value Object: ContentModelId
 * Represents a unique identifier for a Content Model
 * Immutable and validated
 */
export class ContentModelId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create a new ContentModelId from an existing UUID string
   */
  static fromString(id: string): ContentModelId {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("ContentModelId must be a non-empty string");
    }
    return new ContentModelId(id);
  }

  /**
   * Generate a new ContentModelId
   */
  static generate(): ContentModelId {
    return new ContentModelId(randomUUID());
  }

  /**
   * Get the string value of the ID
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another ContentModelId
   */
  equals(other: ContentModelId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
