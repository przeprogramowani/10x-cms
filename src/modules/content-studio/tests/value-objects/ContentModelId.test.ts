import {describe, it, expect} from "vitest";
import {ContentModelId} from "../../domain/value-objects/ContentModelId";

describe("ContentModelId", () => {
  describe("generate", () => {
    it("should generate a valid ContentModelId", () => {
      const id = ContentModelId.generate();
      expect(id).toBeInstanceOf(ContentModelId);
      expect(id.toString()).toBeDefined();
      expect(typeof id.toString()).toBe("string");
    });

    it("should generate unique IDs", () => {
      const id1 = ContentModelId.generate();
      const id2 = ContentModelId.generate();
      expect(id1.toString()).not.toBe(id2.toString());
    });

    it("should generate valid UUID format", () => {
      const id = ContentModelId.generate();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id.toString()).toMatch(uuidRegex);
    });
  });

  describe("fromString", () => {
    it("should create ContentModelId from valid string", () => {
      const value = "model-id-123";
      const id = ContentModelId.fromString(value);
      expect(id.toString()).toBe(value);
    });

    it("should throw error for empty string", () => {
      expect(() => ContentModelId.fromString("")).toThrow(
        "ContentModelId must be a non-empty string"
      );
    });

    it("should throw error for whitespace-only string", () => {
      expect(() => ContentModelId.fromString("   ")).toThrow(
        "ContentModelId must be a non-empty string"
      );
    });

    it("should throw error for null", () => {
      expect(() => ContentModelId.fromString(null as any)).toThrow(
        "ContentModelId must be a non-empty string"
      );
    });

    it("should throw error for undefined", () => {
      expect(() => ContentModelId.fromString(undefined as any)).toThrow(
        "ContentModelId must be a non-empty string"
      );
    });
  });

  describe("equals", () => {
    it("should return true for same ID values", () => {
      const value = "model-id-123";
      const id1 = ContentModelId.fromString(value);
      const id2 = ContentModelId.fromString(value);
      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for different ID values", () => {
      const id1 = ContentModelId.fromString("model-1");
      const id2 = ContentModelId.fromString("model-2");
      expect(id1.equals(id2)).toBe(false);
    });

    it("should return false for null", () => {
      const id = ContentModelId.fromString("test-id");
      expect(id.equals(null as any)).toBe(false);
    });

    it("should return false for undefined", () => {
      const id = ContentModelId.fromString("test-id");
      expect(id.equals(undefined as any)).toBe(false);
    });

    it("should be reflexive - id equals itself", () => {
      const id = ContentModelId.generate();
      expect(id.equals(id)).toBe(true);
    });

    it("should be symmetric - if id1 equals id2, then id2 equals id1", () => {
      const value = "model-id-123";
      const id1 = ContentModelId.fromString(value);
      const id2 = ContentModelId.fromString(value);
      expect(id1.equals(id2)).toBe(id2.equals(id1));
    });
  });

  describe("toString", () => {
    it("should return string representation of ID", () => {
      const value = "model-id-123";
      const id = ContentModelId.fromString(value);
      expect(id.toString()).toBe(value);
    });

    it("should preserve the original value", () => {
      const value = "my-custom-model-id-with-dashes";
      const id = ContentModelId.fromString(value);
      expect(id.toString()).toBe(value);
    });
  });
});
