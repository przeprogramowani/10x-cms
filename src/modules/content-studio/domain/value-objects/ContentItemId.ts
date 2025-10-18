import {randomUUID} from "crypto";

/**
 * Value Object: ContentItemId
 * Represents a unique identifier for a Content Item
 * Immutable and validated
 */
export class ContentItemId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create a new ContentItemId from an existing UUID string
   */
  static fromString(id: string): ContentItemId {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("ContentItemId must be a non-empty string");
    }
    return new ContentItemId(id);
  }

  /**
   * Generate a new ContentItemId
   */
  static generate(): ContentItemId {
    return new ContentItemId(randomUUID());
  }

  /**
   * Get the string value of the ID
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another ContentItemId
   */
  equals(other: ContentItemId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
