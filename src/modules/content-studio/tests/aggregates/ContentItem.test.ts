import {describe, it, expect, beforeEach} from "vitest";
import {ContentItem} from "../../domain/aggregates/ContentItem";
import {ContentModelId} from "../../domain/value-objects/ContentModelId";
import {ContentItemId} from "../../domain/value-objects/ContentItemId";
import {ContentStatus} from "../../domain/value-objects/ContentStatus";
import {RevisionData} from "../../domain/entities/Revision";

describe("ContentItem", () => {
  let contentModelId: ContentModelId;

  beforeEach(() => {
    contentModelId = ContentModelId.generate();
  });

  describe("create", () => {
    it("should create a valid content item", () => {
      const initialData: RevisionData = {
        title: "My Article",
        content: "Article content",
      };

      const item = ContentItem.create(contentModelId, initialData, "user123");

      expect(item).toBeInstanceOf(ContentItem);
      expect(item.id).toBeInstanceOf(ContentItemId);
      expect(item.contentModelId).toBe(contentModelId);
      expect(item.currentData).toEqual(initialData);
      expect(item.createdBy).toBe("user123");
      expect(item.updatedBy).toBe("user123");
      expect(item.status.isDraft()).toBe(true);
    });

    it("should create initial revision on creation", () => {
      const initialData: RevisionData = {title: "Test"};
      const item = ContentItem.create(contentModelId, initialData, "user123");

      expect(item.getRevisionCount()).toBe(1);
      const revision = item.getCurrentRevision();
      expect(revision.revisionNumber).toBe(1);
      expect(revision.contentData).toEqual(initialData);
      expect(revision.comment).toBe("Initial creation");
    });

    it("should set timestamps on creation", () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Test"},
        "user123"
      );

      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
      expect(item.createdAt.getTime()).toBe(item.updatedAt.getTime());
    });

    it("should throw error for empty createdBy", () => {
      expect(() =>
        ContentItem.create(contentModelId, {title: "Test"}, "")
      ).toThrow("createdBy is required");
    });

    it("should throw error for whitespace-only createdBy", () => {
      expect(() =>
        ContentItem.create(contentModelId, {title: "Test"}, "   ")
      ).toThrow("createdBy is required");
    });

    it("should create with empty metadata by default", () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Test"},
        "user123"
      );
      expect(item.metadata).toEqual({});
    });

    it("should create with provided metadata", () => {
      const metadata = {tags: ["tech", "news"], featured: true};
      const item = ContentItem.create(
        contentModelId,
        {title: "Test"},
        "user123",
        metadata
      );

      expect(item.metadata).toEqual(metadata);
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute content item from persistence", () => {
      const revisions = [
        {
          revisionId: "rev-1",
          revisionNumber: 1,
          contentData: {title: "V1"},
          createdAt: new Date("2024-01-01"),
          createdBy: "user1",
          comment: "Initial",
        },
        {
          revisionId: "rev-2",
          revisionNumber: 2,
          contentData: {title: "V2"},
          createdAt: new Date("2024-01-02"),
          createdBy: "user2",
          comment: "Update",
        },
      ];

      const item = ContentItem.reconstitute(
        "item-123",
        "model-456",
        {title: "V2"},
        revisions,
        "PUBLISHED",
        "user1",
        "user2",
        {tags: ["tech"]},
        new Date("2024-01-01"),
        new Date("2024-01-02")
      );

      expect(item.id.toString()).toBe("item-123");
      expect(item.contentModelId.toString()).toBe("model-456");
      expect(item.currentData).toEqual({title: "V2"});
      expect(item.status.isPublished()).toBe(true);
      expect(item.createdBy).toBe("user1");
      expect(item.updatedBy).toBe("user2");
      expect(item.metadata).toEqual({tags: ["tech"]});
      expect(item.getRevisionCount()).toBe(2);
    });
  });

  describe("updateContent", () => {
    it("should update content and create new revision", () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Original"},
        "user1"
      );
      const initialRevisionCount = item.getRevisionCount();

      item.updateContent({title: "Updated"}, "user2", "Content update");

      expect(item.currentData).toEqual({title: "Updated"});
      expect(item.updatedBy).toBe("user2");
      expect(item.getRevisionCount()).toBe(initialRevisionCount + 1);

      const latestRevision = item.getCurrentRevision();
      expect(latestRevision.revisionNumber).toBe(2);
      expect(latestRevision.contentData).toEqual({title: "Updated"});
      expect(latestRevision.comment).toBe("Content update");
      expect(latestRevision.createdBy).toBe("user2");
    });

    it("should update timestamp on content update", async () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Original"},
        "user1"
      );
      const oldUpdatedAt = item.updatedAt;

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      item.updateContent({title: "Updated"}, "user1");
      expect(item.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should throw error for empty updatedBy", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      expect(() => item.updateContent({title: "Updated"}, "")).toThrow(
        "updatedBy is required"
      );
    });

    it("should throw error for whitespace-only updatedBy", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      expect(() => item.updateContent({title: "Updated"}, "   ")).toThrow(
        "updatedBy is required"
      );
    });

    it("should allow update without comment", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");
      item.updateContent({title: "Updated"}, "user1");

      const revision = item.getCurrentRevision();
      expect(revision.comment).toBeUndefined();
    });

    it("should create sequential revision numbers", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");

      item.updateContent({title: "V2"}, "user1");
      item.updateContent({title: "V3"}, "user1");
      item.updateContent({title: "V4"}, "user1");

      expect(item.getRevisionCount()).toBe(4);
      expect(item.getCurrentRevision().revisionNumber).toBe(4);
    });
  });

  describe("changeStatus", () => {
    it("should change status when transition is allowed", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      expect(item.status.isDraft()).toBe(true);

      item.changeStatus(ContentStatus.readyForReview());
      expect(item.status.isReadyForReview()).toBe(true);
    });

    it("should throw error for invalid status transition", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");
      item.changeStatus(ContentStatus.published());

      expect(() => item.changeStatus(ContentStatus.draft())).toThrow(
        "Cannot transition from PUBLISHED to DRAFT"
      );
    });

    it("should not change status if already in that status", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");
      const initialStatus = item.status;

      item.changeStatus(ContentStatus.draft());

      expect(item.status).toBe(initialStatus);
    });

    it("should update timestamp on status change", async () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");
      const oldUpdatedAt = item.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      item.changeStatus(ContentStatus.published());
      expect(item.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should support full editorial workflow", () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Article"},
        "author"
      );

      // Draft → Ready for Review
      expect(item.status.isDraft()).toBe(true);
      item.changeStatus(ContentStatus.readyForReview());
      expect(item.status.isReadyForReview()).toBe(true);

      // Ready for Review → Draft (changes requested)
      item.changeStatus(ContentStatus.draft());
      expect(item.status.isDraft()).toBe(true);

      // Draft → Published (direct publish)
      item.changeStatus(ContentStatus.published());
      expect(item.status.isPublished()).toBe(true);

      // Published → Archived
      item.changeStatus(ContentStatus.archived());
      expect(item.status.isArchived()).toBe(true);

      // Archived → Draft (restore)
      item.changeStatus(ContentStatus.draft());
      expect(item.status.isDraft()).toBe(true);
    });
  });

  describe("getRevision", () => {
    it("should retrieve specific revision by number", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      item.updateContent({title: "V2"}, "user1");
      item.updateContent({title: "V3"}, "user1");

      const revision2 = item.getRevision(2);
      expect(revision2).toBeDefined();
      expect(revision2!.revisionNumber).toBe(2);
      expect(revision2!.contentData).toEqual({title: "V2"});
    });

    it("should return undefined for non-existent revision", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      const revision = item.getRevision(999);
      expect(revision).toBeUndefined();
    });
  });

  describe("getCurrentRevision", () => {
    it("should return the latest revision", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      item.updateContent({title: "V2"}, "user1");
      item.updateContent({title: "V3"}, "user1");

      const current = item.getCurrentRevision();
      expect(current.revisionNumber).toBe(3);
      expect(current.contentData).toEqual({title: "V3"});
    });

    it("should throw error if no revisions exist", () => {
      // This shouldn't normally happen, but testing defensive code
      const revisions: any[] = [];
      const item = ContentItem.reconstitute(
        "item-1",
        "model-1",
        {},
        revisions,
        "DRAFT",
        "user1",
        "user1",
        {},
        new Date(),
        new Date()
      );

      expect(() => item.getCurrentRevision()).toThrow(
        "ContentItem has no revisions"
      );
    });
  });

  describe("revertToRevision", () => {
    it("should revert content to previous revision", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      item.updateContent({title: "V2"}, "user1");
      item.updateContent({title: "V3"}, "user1");

      expect(item.currentData).toEqual({title: "V3"});
      expect(item.getRevisionCount()).toBe(3);

      item.revertToRevision(1, "user2");

      expect(item.currentData).toEqual({title: "V1"});
      expect(item.getRevisionCount()).toBe(4); // Revert creates a new revision
      expect(item.getCurrentRevision().comment).toBe("Reverted to revision 1");
      expect(item.updatedBy).toBe("user2");
    });

    it("should throw error for non-existent revision", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      expect(() => item.revertToRevision(999, "user1")).toThrow(
        "Revision 999 not found"
      );
    });

    it("should create new revision when reverting", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      item.updateContent({title: "V2"}, "user1");
      const countBeforeRevert = item.getRevisionCount();

      item.revertToRevision(1, "user1");

      expect(item.getRevisionCount()).toBe(countBeforeRevert + 1);
    });
  });

  describe("updateMetadata", () => {
    it("should update metadata", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      item.updateMetadata({tags: ["news"], featured: true});

      expect(item.metadata).toEqual({tags: ["news"], featured: true});
    });

    it("should merge metadata, not replace", () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Test"},
        "user1",
        {existing: "value"}
      );

      item.updateMetadata({newField: "newValue"});

      expect(item.metadata).toEqual({
        existing: "value",
        newField: "newValue",
      });
    });

    it("should update timestamp on metadata update", async () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");
      const oldUpdatedAt = item.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      item.updateMetadata({key: "value"});
      expect(item.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });

  describe("getRevisionCount", () => {
    it("should return correct revision count", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      expect(item.getRevisionCount()).toBe(1);

      item.updateContent({title: "V2"}, "user1");
      expect(item.getRevisionCount()).toBe(2);

      item.updateContent({title: "V3"}, "user1");
      expect(item.getRevisionCount()).toBe(3);
    });
  });

  describe("revisions getter", () => {
    it("should return all revisions", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      item.updateContent({title: "V2"}, "user1");
      item.updateContent({title: "V3"}, "user1");

      const revisions = item.revisions;
      expect(revisions.length).toBe(3);
      expect(revisions[0]?.revisionNumber).toBe(1);
      expect(revisions[1]?.revisionNumber).toBe(2);
      expect(revisions[2]?.revisionNumber).toBe(3);
    });

    it("should return a copy of revisions array", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");
      const revisions = item.revisions;

      // Try to modify the array
      revisions.push({} as any);

      // Original should not be affected
      expect(item.getRevisionCount()).toBe(1);
    });
  });

  describe("toObject", () => {
    it("should convert content item to plain object", () => {
      const item = ContentItem.create(
        contentModelId,
        {title: "Test"},
        "user1",
        {tags: ["tech"]}
      );

      const obj = item.toObject();

      expect(obj).toEqual({
        id: item.id.toString(),
        contentModelId: contentModelId.toString(),
        currentData: {title: "Test"},
        revisions: expect.any(Array),
        status: "DRAFT",
        createdBy: "user1",
        updatedBy: "user1",
        metadata: {tags: ["tech"]},
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    });

    it("should include all revisions in serialized form", () => {
      const item = ContentItem.create(contentModelId, {title: "V1"}, "user1");
      item.updateContent({title: "V2"}, "user1");

      const obj = item.toObject();

      expect(obj.revisions.length).toBe(2);
      expect(obj.revisions[0]).toHaveProperty("revisionId");
      expect(obj.revisions[0]).toHaveProperty("revisionNumber");
      expect(obj.revisions[0]).toHaveProperty("contentData");
    });
  });

  describe("getters", () => {
    it("should provide read access to all properties", () => {
      const metadata = {tags: ["tech"]};
      const item = ContentItem.create(
        contentModelId,
        {title: "Test"},
        "user1",
        metadata
      );

      expect(item.id).toBeInstanceOf(ContentItemId);
      expect(item.contentModelId).toBe(contentModelId);
      expect(item.currentData).toEqual({title: "Test"});
      expect(item.status).toBeInstanceOf(ContentStatus);
      expect(item.createdBy).toBe("user1");
      expect(item.updatedBy).toBe("user1");
      expect(item.metadata).toEqual(metadata);
      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it("should return copies, not internal references", () => {
      const item = ContentItem.create(contentModelId, {title: "Test"}, "user1");

      const data = item.currentData;
      data.title = "Modified";
      expect(item.currentData.title).toBe("Test");

      const metadata = item.metadata;
      metadata.newField = "value";
      expect(item.metadata.newField).toBeUndefined();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete content lifecycle", () => {
      // Create draft content
      const item = ContentItem.create(
        contentModelId,
        {title: "My Article", content: "Initial content"},
        "author@example.com"
      );

      expect(item.status.isDraft()).toBe(true);
      expect(item.getRevisionCount()).toBe(1);

      // Author makes updates
      item.updateContent(
        {title: "My Article", content: "Updated content"},
        "author@example.com",
        "Improved introduction"
      );
      expect(item.getRevisionCount()).toBe(2);

      // Submit for review
      item.changeStatus(ContentStatus.readyForReview());
      expect(item.status.isReadyForReview()).toBe(true);

      // Reviewer requests changes
      item.changeStatus(ContentStatus.draft());
      item.updateContent(
        {title: "My Article", content: "Final content"},
        "author@example.com",
        "Addressed review comments"
      );
      expect(item.getRevisionCount()).toBe(3);

      // Publish
      item.changeStatus(ContentStatus.published());
      expect(item.status.isPublished()).toBe(true);

      // Add metadata
      item.updateMetadata({publishedAt: new Date().toISOString(), views: 0});

      // Later, archive
      item.changeStatus(ContentStatus.archived());
      expect(item.status.isArchived()).toBe(true);

      // Verify all revisions are preserved
      expect(item.getRevisionCount()).toBe(3);
      expect(item.getRevision(1)?.contentData.content).toBe("Initial content");
      expect(item.getRevision(2)?.contentData.content).toBe("Updated content");
      expect(item.getRevision(3)?.contentData.content).toBe("Final content");
    });
  });
});
