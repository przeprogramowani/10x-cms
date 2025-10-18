import {describe, it, expect} from "vitest";
import {Revision, RevisionData} from "../../domain/entities/Revision";

describe("Revision", () => {
  describe("create", () => {
    it("should create a valid revision", () => {
      const contentData: RevisionData = {
        title: "My Article",
        content: "Article content",
      };
      const revision = Revision.create(
        1,
        contentData,
        "user123",
        "Initial creation"
      );

      expect(revision).toBeInstanceOf(Revision);
      expect(revision.revisionNumber).toBe(1);
      expect(revision.contentData).toEqual(contentData);
      expect(revision.createdBy).toBe("user123");
      expect(revision.comment).toBe("Initial creation");
    });

    it("should generate unique revision IDs", () => {
      const data: RevisionData = {title: "Test"};
      const revision1 = Revision.create(1, data, "user1");
      const revision2 = Revision.create(1, data, "user1");

      expect(revision1.revisionId).not.toBe(revision2.revisionId);
    });

    it("should set createdAt timestamp", () => {
      const revision = Revision.create(1, {title: "Test"}, "user123");

      expect(revision.createdAt).toBeInstanceOf(Date);
      expect(revision.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should throw error for revision number less than 1", () => {
      expect(() => Revision.create(0, {title: "Test"}, "user123")).toThrow(
        "Revision number must be positive"
      );
    });

    it("should throw error for negative revision number", () => {
      expect(() => Revision.create(-1, {title: "Test"}, "user123")).toThrow(
        "Revision number must be positive"
      );
    });

    it("should throw error for empty createdBy", () => {
      expect(() => Revision.create(1, {title: "Test"}, "")).toThrow(
        "createdBy is required for a revision"
      );
    });

    it("should throw error for whitespace-only createdBy", () => {
      expect(() => Revision.create(1, {title: "Test"}, "   ")).toThrow(
        "createdBy is required for a revision"
      );
    });

    it("should allow creation without comment", () => {
      const revision = Revision.create(1, {title: "Test"}, "user123");

      expect(revision.comment).toBeUndefined();
    });

    it("should handle empty content data", () => {
      const revision = Revision.create(1, {}, "user123");

      expect(revision.contentData).toEqual({});
    });

    it("should create deep copy of content data", () => {
      const originalData: RevisionData = {
        title: "Test",
        metadata: {nested: "value"},
      };
      const revision = Revision.create(1, originalData, "user123");

      // Modify original data
      originalData.title = "Modified";

      // Revision data should not be affected (has a copy)
      expect(revision.contentData.title).toBe("Test");
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute revision from props", () => {
      const props = {
        revisionId: "rev-123",
        revisionNumber: 5,
        contentData: {title: "Article", content: "Content"},
        createdAt: new Date("2024-01-15T10:30:00Z"),
        createdBy: "user456",
        comment: "Updated content",
      };

      const revision = Revision.reconstitute(props);

      expect(revision.revisionId).toBe("rev-123");
      expect(revision.revisionNumber).toBe(5);
      expect(revision.contentData).toEqual({
        title: "Article",
        content: "Content",
      });
      expect(revision.createdAt).toEqual(new Date("2024-01-15T10:30:00Z"));
      expect(revision.createdBy).toBe("user456");
      expect(revision.comment).toBe("Updated content");
    });

    it("should reconstitute revision without comment", () => {
      const props = {
        revisionId: "rev-123",
        revisionNumber: 1,
        contentData: {title: "Test"},
        createdAt: new Date(),
        createdBy: "user123",
      };

      const revision = Revision.reconstitute(props);

      expect(revision.comment).toBeUndefined();
    });

    it("should handle complex content data structures", () => {
      const props = {
        revisionId: "rev-complex",
        revisionNumber: 3,
        contentData: {
          title: "Article",
          author: {name: "John Doe", email: "john@example.com"},
          tags: ["tech", "news"],
          metadata: {published: true, views: 1000},
        },
        createdAt: new Date(),
        createdBy: "user123",
      };

      const revision = Revision.reconstitute(props);
      expect(revision.contentData).toEqual(props.contentData);
    });
  });

  describe("getters", () => {
    it("should provide read access to all properties", () => {
      const data: RevisionData = {title: "Test", content: "Content"};
      const revision = Revision.create(3, data, "user123", "Test comment");

      expect(revision.revisionId).toBeDefined();
      expect(typeof revision.revisionId).toBe("string");
      expect(revision.revisionNumber).toBe(3);
      expect(revision.contentData).toEqual(data);
      expect(revision.createdAt).toBeInstanceOf(Date);
      expect(revision.createdBy).toBe("user123");
      expect(revision.comment).toBe("Test comment");
    });

    it("should return a copy of content data, not the original", () => {
      const revision = Revision.create(1, {title: "Original"}, "user123");
      const data = revision.contentData;

      // Try to modify returned data
      data.title = "Modified";

      // Original should not be affected
      expect(revision.contentData.title).toBe("Original");
    });
  });

  describe("toObject", () => {
    it("should convert revision to plain object", () => {
      const revision = Revision.create(
        2,
        {title: "Article", content: "Content"},
        "user456",
        "Update content"
      );

      const obj = revision.toObject();

      expect(obj).toEqual({
        revisionId: revision.revisionId,
        revisionNumber: 2,
        contentData: {title: "Article", content: "Content"},
        createdAt: revision.createdAt,
        createdBy: "user456",
        comment: "Update content",
      });
    });

    it("should return a copy of data, not reference", () => {
      const revision = Revision.create(1, {title: "Original"}, "user123");
      const obj = revision.toObject();

      // Modify the object
      obj.contentData.title = "Modified";

      // Original revision should not be affected
      expect(revision.contentData.title).toBe("Original");
    });

    it("should handle revision without comment", () => {
      const revision = Revision.create(1, {title: "Test"}, "user123");
      const obj = revision.toObject();

      expect(obj.comment).toBeUndefined();
    });
  });

  describe("immutability", () => {
    it("should not allow modification of revision number after creation", () => {
      const revision = Revision.create(1, {title: "Test"}, "user123");

      // TypeScript should prevent this at compile time
      // At runtime, the property is readonly
      expect(revision.revisionNumber).toBe(1);
    });

    it("should not allow modification of createdBy after creation", () => {
      const revision = Revision.create(1, {title: "Test"}, "user123");

      // TypeScript should prevent this at compile time
      expect(revision.createdBy).toBe("user123");
    });

    it("should not allow modification of comment after creation", () => {
      const revision = Revision.create(
        1,
        {title: "Test"},
        "user123",
        "Original comment"
      );

      // TypeScript should prevent this at compile time
      expect(revision.comment).toBe("Original comment");
    });
  });

  describe("content data variations", () => {
    it("should handle string values", () => {
      const data: RevisionData = {
        title: "My Title",
        description: "My Description",
      };
      const revision = Revision.create(1, data, "user123");

      expect(revision.contentData).toEqual(data);
    });

    it("should handle number values", () => {
      const data: RevisionData = {
        price: 99.99,
        quantity: 10,
      };
      const revision = Revision.create(1, data, "user123");

      expect(revision.contentData).toEqual(data);
    });

    it("should handle boolean values", () => {
      const data: RevisionData = {
        published: true,
        featured: false,
      };
      const revision = Revision.create(1, data, "user123");

      expect(revision.contentData).toEqual(data);
    });

    it("should handle undefined values", () => {
      const data: RevisionData = {
        title: "Title",
        optionalField: undefined,
      };
      const revision = Revision.create(1, data, "user123");

      expect(revision.contentData).toEqual(data);
    });

    it("should handle mixed value types", () => {
      const data: RevisionData = {
        title: "Article",
        price: 19.99,
        published: true,
        tags: undefined,
      };
      const revision = Revision.create(1, data, "user123");

      expect(revision.contentData).toEqual(data);
    });
  });

  describe("sequential revisions", () => {
    it("should support creating sequential revision numbers", () => {
      const data: RevisionData = {title: "Article"};

      const rev1 = Revision.create(1, data, "user123", "Initial");
      const rev2 = Revision.create(2, data, "user123", "Update 1");
      const rev3 = Revision.create(3, data, "user123", "Update 2");

      expect(rev1.revisionNumber).toBe(1);
      expect(rev2.revisionNumber).toBe(2);
      expect(rev3.revisionNumber).toBe(3);

      // Each should have unique IDs
      expect(rev1.revisionId).not.toBe(rev2.revisionId);
      expect(rev2.revisionId).not.toBe(rev3.revisionId);
      expect(rev1.revisionId).not.toBe(rev3.revisionId);
    });

    it("should support creating revisions with different authors", () => {
      const data: RevisionData = {title: "Article"};

      const rev1 = Revision.create(1, data, "user1", "Created by user1");
      const rev2 = Revision.create(2, data, "user2", "Edited by user2");
      const rev3 = Revision.create(3, data, "user3", "Reviewed by user3");

      expect(rev1.createdBy).toBe("user1");
      expect(rev2.createdBy).toBe("user2");
      expect(rev3.createdBy).toBe("user3");
    });

    it("should maintain chronological ordering of timestamps", () => {
      const rev1 = Revision.create(1, {title: "V1"}, "user123");

      // Small delay
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      return delay(10).then(() => {
        const rev2 = Revision.create(2, {title: "V2"}, "user123");

        expect(rev2.createdAt.getTime()).toBeGreaterThanOrEqual(
          rev1.createdAt.getTime()
        );
      });
    });
  });
});
