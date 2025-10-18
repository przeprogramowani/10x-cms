import {describe, it, expect} from "vitest";
import {
  ContentStatus,
  ContentStatusType,
} from "../../domain/value-objects/ContentStatus";

describe("ContentStatus", () => {
  describe("factory methods", () => {
    it("should create DRAFT status", () => {
      const status = ContentStatus.draft();
      expect(status).toBeInstanceOf(ContentStatus);
      expect(status.toString()).toBe(ContentStatusType.DRAFT);
      expect(status.isDraft()).toBe(true);
    });

    it("should create READY_FOR_REVIEW status", () => {
      const status = ContentStatus.readyForReview();
      expect(status).toBeInstanceOf(ContentStatus);
      expect(status.toString()).toBe(ContentStatusType.READY_FOR_REVIEW);
      expect(status.isReadyForReview()).toBe(true);
    });

    it("should create PUBLISHED status", () => {
      const status = ContentStatus.published();
      expect(status).toBeInstanceOf(ContentStatus);
      expect(status.toString()).toBe(ContentStatusType.PUBLISHED);
      expect(status.isPublished()).toBe(true);
    });

    it("should create ARCHIVED status", () => {
      const status = ContentStatus.archived();
      expect(status).toBeInstanceOf(ContentStatus);
      expect(status.toString()).toBe(ContentStatusType.ARCHIVED);
      expect(status.isArchived()).toBe(true);
    });
  });

  describe("fromString", () => {
    it("should create DRAFT status from string", () => {
      const status = ContentStatus.fromString("DRAFT");
      expect(status.isDraft()).toBe(true);
    });

    it("should create READY_FOR_REVIEW status from string", () => {
      const status = ContentStatus.fromString("READY_FOR_REVIEW");
      expect(status.isReadyForReview()).toBe(true);
    });

    it("should create PUBLISHED status from string", () => {
      const status = ContentStatus.fromString("PUBLISHED");
      expect(status.isPublished()).toBe(true);
    });

    it("should create ARCHIVED status from string", () => {
      const status = ContentStatus.fromString("ARCHIVED");
      expect(status.isArchived()).toBe(true);
    });

    it("should throw error for invalid status", () => {
      expect(() => ContentStatus.fromString("INVALID")).toThrow(
        "Invalid content status: INVALID"
      );
    });

    it("should throw error for empty string", () => {
      expect(() => ContentStatus.fromString("")).toThrow(
        "Invalid content status:"
      );
    });
  });

  describe("status check methods", () => {
    it("should correctly identify DRAFT status", () => {
      const status = ContentStatus.draft();
      expect(status.isDraft()).toBe(true);
      expect(status.isReadyForReview()).toBe(false);
      expect(status.isPublished()).toBe(false);
      expect(status.isArchived()).toBe(false);
    });

    it("should correctly identify READY_FOR_REVIEW status", () => {
      const status = ContentStatus.readyForReview();
      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForReview()).toBe(true);
      expect(status.isPublished()).toBe(false);
      expect(status.isArchived()).toBe(false);
    });

    it("should correctly identify PUBLISHED status", () => {
      const status = ContentStatus.published();
      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForReview()).toBe(false);
      expect(status.isPublished()).toBe(true);
      expect(status.isArchived()).toBe(false);
    });

    it("should correctly identify ARCHIVED status", () => {
      const status = ContentStatus.archived();
      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForReview()).toBe(false);
      expect(status.isPublished()).toBe(false);
      expect(status.isArchived()).toBe(true);
    });
  });

  describe("equals", () => {
    it("should return true for same status values", () => {
      const status1 = ContentStatus.draft();
      const status2 = ContentStatus.draft();
      expect(status1.equals(status2)).toBe(true);
    });

    it("should return false for different status values", () => {
      const status1 = ContentStatus.draft();
      const status2 = ContentStatus.published();
      expect(status1.equals(status2)).toBe(false);
    });

    it("should return false for null", () => {
      const status = ContentStatus.draft();
      expect(status.equals(null as any)).toBe(false);
    });

    it("should return false for undefined", () => {
      const status = ContentStatus.draft();
      expect(status.equals(undefined as any)).toBe(false);
    });
  });

  describe("canTransitionTo - business rules validation", () => {
    describe("from DRAFT", () => {
      it("should allow transition to READY_FOR_REVIEW", () => {
        const draft = ContentStatus.draft();
        const readyForReview = ContentStatus.readyForReview();
        expect(draft.canTransitionTo(readyForReview)).toBe(true);
      });

      it("should allow transition to PUBLISHED", () => {
        const draft = ContentStatus.draft();
        const published = ContentStatus.published();
        expect(draft.canTransitionTo(published)).toBe(true);
      });

      it("should allow transition to ARCHIVED", () => {
        const draft = ContentStatus.draft();
        const archived = ContentStatus.archived();
        expect(draft.canTransitionTo(archived)).toBe(true);
      });

      it("should not allow transition to DRAFT (same state)", () => {
        const draft = ContentStatus.draft();
        expect(draft.canTransitionTo(draft)).toBe(false);
      });
    });

    describe("from READY_FOR_REVIEW", () => {
      it("should allow transition to DRAFT (changes requested)", () => {
        const readyForReview = ContentStatus.readyForReview();
        const draft = ContentStatus.draft();
        expect(readyForReview.canTransitionTo(draft)).toBe(true);
      });

      it("should allow transition to PUBLISHED", () => {
        const readyForReview = ContentStatus.readyForReview();
        const published = ContentStatus.published();
        expect(readyForReview.canTransitionTo(published)).toBe(true);
      });

      it("should not allow transition to ARCHIVED", () => {
        const readyForReview = ContentStatus.readyForReview();
        const archived = ContentStatus.archived();
        expect(readyForReview.canTransitionTo(archived)).toBe(false);
      });
    });

    describe("from PUBLISHED", () => {
      it("should allow transition to ARCHIVED", () => {
        const published = ContentStatus.published();
        const archived = ContentStatus.archived();
        expect(published.canTransitionTo(archived)).toBe(true);
      });

      it("should not allow transition to DRAFT", () => {
        const published = ContentStatus.published();
        const draft = ContentStatus.draft();
        expect(published.canTransitionTo(draft)).toBe(false);
      });

      it("should not allow transition to READY_FOR_REVIEW", () => {
        const published = ContentStatus.published();
        const readyForReview = ContentStatus.readyForReview();
        expect(published.canTransitionTo(readyForReview)).toBe(false);
      });
    });

    describe("from ARCHIVED", () => {
      it("should allow transition to DRAFT (restore)", () => {
        const archived = ContentStatus.archived();
        const draft = ContentStatus.draft();
        expect(archived.canTransitionTo(draft)).toBe(true);
      });

      it("should not allow transition to PUBLISHED", () => {
        const archived = ContentStatus.archived();
        const published = ContentStatus.published();
        expect(archived.canTransitionTo(published)).toBe(false);
      });

      it("should not allow transition to READY_FOR_REVIEW", () => {
        const archived = ContentStatus.archived();
        const readyForReview = ContentStatus.readyForReview();
        expect(archived.canTransitionTo(readyForReview)).toBe(false);
      });
    });
  });

  describe("toString", () => {
    it("should return string representation of status", () => {
      expect(ContentStatus.draft().toString()).toBe("DRAFT");
      expect(ContentStatus.readyForReview().toString()).toBe(
        "READY_FOR_REVIEW"
      );
      expect(ContentStatus.published().toString()).toBe("PUBLISHED");
      expect(ContentStatus.archived().toString()).toBe("ARCHIVED");
    });
  });
});
