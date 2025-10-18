import {describe, it, expect, beforeEach} from "vitest";
import {ContentModel} from "../../domain/aggregates/ContentModel";
import {ContentModelId} from "../../domain/value-objects/ContentModelId";
import {
  FieldDefinition,
  FieldType,
} from "../../domain/value-objects/FieldDefinition";

describe("ContentModel", () => {
  let titleField: FieldDefinition;
  let contentField: FieldDefinition;
  let publishDateField: FieldDefinition;

  beforeEach(() => {
    titleField = FieldDefinition.create(
      "title",
      FieldType.STRING,
      true,
      undefined,
      {
        minLength: 5,
        maxLength: 100,
      }
    );
    contentField = FieldDefinition.create("content", FieldType.RICHTEXT, true);
    publishDateField = FieldDefinition.create(
      "publishDate",
      FieldType.DATE,
      false
    );
  });

  describe("create", () => {
    it("should create a valid content model", () => {
      const model = ContentModel.create(
        "BlogPost",
        "A blog post content type",
        [titleField, contentField]
      );

      expect(model).toBeInstanceOf(ContentModel);
      expect(model.id).toBeInstanceOf(ContentModelId);
      expect(model.name).toBe("BlogPost");
      expect(model.description).toBe("A blog post content type");
      expect(model.fields.length).toBe(2);
    });

    it("should set timestamps on creation", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      expect(model.createdAt).toBeInstanceOf(Date);
      expect(model.updatedAt).toBeInstanceOf(Date);
      expect(model.createdAt.getTime()).toBe(model.updatedAt.getTime());
    });

    it("should throw error for empty name", () => {
      expect(() =>
        ContentModel.create("", "Description", [titleField])
      ).toThrow("Content model name is required");
    });

    it("should throw error for whitespace-only name", () => {
      expect(() =>
        ContentModel.create("   ", "Description", [titleField])
      ).toThrow("Content model name is required");
    });

    it("should throw error for no fields", () => {
      expect(() => ContentModel.create("BlogPost", "Description", [])).toThrow(
        "Content model must have at least one field"
      );
    });

    it("should throw error for null fields", () => {
      expect(() =>
        ContentModel.create("BlogPost", "Description", null as any)
      ).toThrow("Content model must have at least one field");
    });

    it("should throw error for duplicate field names", () => {
      const field1 = FieldDefinition.create("title", FieldType.STRING, true);
      const field2 = FieldDefinition.create("title", FieldType.TEXT, true);

      expect(() =>
        ContentModel.create("BlogPost", "Description", [field1, field2])
      ).toThrow("Content model cannot have duplicate field names");
    });

    it("should allow empty description", () => {
      const model = ContentModel.create("BlogPost", "", [titleField]);
      expect(model.description).toBe("");
    });

    it("should handle multiple fields", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
        publishDateField,
      ]);

      expect(model.fields.length).toBe(3);
      expect(model.fields[0].fieldName).toBe("title");
      expect(model.fields[1].fieldName).toBe("content");
      expect(model.fields[2].fieldName).toBe("publishDate");
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute content model from persistence", () => {
      const fieldProps = [
        {
          fieldName: "title",
          fieldType: FieldType.STRING,
          required: true,
          defaultValue: undefined,
          validationRules: {minLength: 5},
        },
        {
          fieldName: "content",
          fieldType: FieldType.TEXT,
          required: true,
          defaultValue: undefined,
          validationRules: undefined,
        },
      ];

      const model = ContentModel.reconstitute(
        "model-123",
        "BlogPost",
        "A blog post",
        fieldProps,
        new Date("2024-01-01"),
        new Date("2024-01-02")
      );

      expect(model.id.toString()).toBe("model-123");
      expect(model.name).toBe("BlogPost");
      expect(model.description).toBe("A blog post");
      expect(model.fields.length).toBe(2);
      expect(model.createdAt).toEqual(new Date("2024-01-01"));
      expect(model.updatedAt).toEqual(new Date("2024-01-02"));
    });
  });

  describe("addField", () => {
    it("should add a new field to the model", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const newField = FieldDefinition.create("author", FieldType.STRING, true);
      model.addField(newField);

      expect(model.fields.length).toBe(2);
      expect(model.fields[1].fieldName).toBe("author");
    });

    it("should update timestamp when adding field", async () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);
      const oldUpdatedAt = model.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      model.addField(FieldDefinition.create("author", FieldType.STRING, false));
      expect(model.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should throw error for duplicate field name", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const duplicateField = FieldDefinition.create(
        "title",
        FieldType.TEXT,
        false
      );

      expect(() => model.addField(duplicateField)).toThrow(
        "Field with name 'title' already exists"
      );
    });

    it("should allow adding multiple fields", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      model.addField(FieldDefinition.create("author", FieldType.STRING, true));
      model.addField(FieldDefinition.create("tags", FieldType.STRING, false));
      model.addField(
        FieldDefinition.create("published", FieldType.BOOLEAN, false)
      );

      expect(model.fields.length).toBe(4);
    });
  });

  describe("removeField", () => {
    it("should remove a field from the model", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      model.removeField("title");

      expect(model.fields.length).toBe(1);
      expect(model.fields[0].fieldName).toBe("content");
    });

    it("should update timestamp when removing field", async () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);
      const oldUpdatedAt = model.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      model.removeField("title");
      expect(model.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should throw error for non-existent field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      expect(() => model.removeField("nonexistent")).toThrow(
        "Field 'nonexistent' not found"
      );
    });

    it("should throw error when removing last field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      expect(() => model.removeField("title")).toThrow(
        "Cannot remove the last field from content model"
      );
    });

    it("should allow removing field when multiple fields exist", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
        publishDateField,
      ]);

      model.removeField("content");

      expect(model.fields.length).toBe(2);
      expect(model.getField("title")).toBeDefined();
      expect(model.getField("publishDate")).toBeDefined();
      expect(model.getField("content")).toBeUndefined();
    });
  });

  describe("updateField", () => {
    it("should update an existing field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const updatedField = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        undefined,
        {
          minLength: 10,
          maxLength: 200,
        }
      );

      model.updateField("title", updatedField);

      const field = model.getField("title");
      expect(field?.validationRules?.minLength).toBe(10);
      expect(field?.validationRules?.maxLength).toBe(200);
    });

    it("should update timestamp when updating field", async () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);
      const oldUpdatedAt = model.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      const newField = FieldDefinition.create("title", FieldType.STRING, false);
      model.updateField("title", newField);
      expect(model.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should throw error for non-existent field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);
      const newField = FieldDefinition.create(
        "nonexistent",
        FieldType.STRING,
        false
      );

      expect(() => model.updateField("nonexistent", newField)).toThrow(
        "Field 'nonexistent' not found"
      );
    });

    it("should allow renaming field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const renamedField = FieldDefinition.create(
        "headline",
        FieldType.STRING,
        true
      );
      model.updateField("title", renamedField);

      expect(model.getField("title")).toBeUndefined();
      expect(model.getField("headline")).toBeDefined();
    });

    it("should throw error when renaming causes duplicate", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      const duplicateField = FieldDefinition.create(
        "content",
        FieldType.STRING,
        true
      );

      expect(() => model.updateField("title", duplicateField)).toThrow(
        "Field with name 'content' already exists"
      );
    });

    it("should allow updating field to same name", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const updatedField = FieldDefinition.create(
        "title",
        FieldType.TEXT,
        false
      );
      model.updateField("title", updatedField);

      const field = model.getField("title");
      expect(field?.fieldType).toBe(FieldType.TEXT);
      expect(field?.required).toBe(false);
    });
  });

  describe("updateInfo", () => {
    it("should update name and description", () => {
      const model = ContentModel.create("BlogPost", "Old description", [
        titleField,
      ]);

      model.updateInfo("Article", "New description");

      expect(model.name).toBe("Article");
      expect(model.description).toBe("New description");
    });

    it("should update timestamp when updating info", async () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);
      const oldUpdatedAt = model.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      model.updateInfo("Article", "New description");
      expect(model.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it("should throw error for empty name", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      expect(() => model.updateInfo("", "Description")).toThrow(
        "Content model name is required"
      );
    });

    it("should throw error for whitespace-only name", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      expect(() => model.updateInfo("   ", "Description")).toThrow(
        "Content model name is required"
      );
    });

    it("should allow empty description", () => {
      const model = ContentModel.create("BlogPost", "Old description", [
        titleField,
      ]);

      model.updateInfo("BlogPost", "");

      expect(model.description).toBe("");
    });
  });

  describe("validateContentData", () => {
    it("should validate valid content data", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      const data = {
        title: "My Blog Post",
        content: "This is the content",
      };

      const result = model.validateContentData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect missing required field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      const data = {
        title: "My Blog Post",
        // content is missing
      };

      const result = model.validateContentData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Field 'content' is required");
    });

    it("should detect multiple validation errors", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      const data = {
        title: "Short", // Too short (minLength: 5)
        // content is missing
      };

      const result = model.validateContentData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should allow optional fields to be missing", () => {
      const optionalField = FieldDefinition.create(
        "author",
        FieldType.STRING,
        false
      );
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        optionalField,
      ]);

      const data = {
        title: "My Blog Post",
        // author is optional and missing
      };

      const result = model.validateContentData(data);

      expect(result.valid).toBe(true);
    });

    it("should validate field constraints", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const data = {
        title: "abc", // Too short (minLength: 5)
      };

      const result = model.validateContentData(data);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("at least 5 characters"))
      ).toBe(true);
    });

    it("should validate all fields in model", () => {
      const ageField = FieldDefinition.create(
        "age",
        FieldType.NUMBER,
        true,
        undefined,
        {
          min: 18,
          max: 100,
        }
      );
      const model = ContentModel.create("Person", "Description", [
        titleField,
        ageField,
      ]);

      const data = {
        title: "John Doe",
        age: 15, // Too young (min: 18)
      };

      const result = model.validateContentData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("at least 18"))).toBe(true);
    });

    it("should handle empty data object", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      const result = model.validateContentData({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getField", () => {
    it("should retrieve field by name", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
      ]);

      const field = model.getField("title");

      expect(field).toBeDefined();
      expect(field?.fieldName).toBe("title");
      expect(field?.fieldType).toBe(FieldType.STRING);
    });

    it("should return undefined for non-existent field", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const field = model.getField("nonexistent");

      expect(field).toBeUndefined();
    });

    it("should retrieve all fields individually", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
        publishDateField,
      ]);

      expect(model.getField("title")).toBeDefined();
      expect(model.getField("content")).toBeDefined();
      expect(model.getField("publishDate")).toBeDefined();
    });
  });

  describe("toObject", () => {
    it("should convert content model to plain object", () => {
      const model = ContentModel.create("BlogPost", "A blog post", [
        titleField,
        contentField,
      ]);

      const obj = model.toObject();

      expect(obj).toEqual({
        id: model.id.toString(),
        name: "BlogPost",
        description: "A blog post",
        fields: expect.any(Array),
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      });
    });

    it("should serialize all field definitions", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const obj = model.toObject();

      expect(obj.fields.length).toBe(1);
      expect(obj.fields[0]).toEqual({
        fieldName: "title",
        fieldType: FieldType.STRING,
        required: true,
        defaultValue: undefined,
        validationRules: {minLength: 5, maxLength: 100},
      });
    });

    it("should handle multiple fields in serialization", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
        contentField,
        publishDateField,
      ]);

      const obj = model.toObject();

      expect(obj.fields.length).toBe(3);
      expect(obj.fields[0].fieldName).toBe("title");
      expect(obj.fields[1].fieldName).toBe("content");
      expect(obj.fields[2].fieldName).toBe("publishDate");
    });
  });

  describe("getters", () => {
    it("should provide read access to all properties", () => {
      const model = ContentModel.create("BlogPost", "A blog post", [
        titleField,
        contentField,
      ]);

      expect(model.id).toBeInstanceOf(ContentModelId);
      expect(model.name).toBe("BlogPost");
      expect(model.description).toBe("A blog post");
      expect(model.fields.length).toBe(2);
      expect(model.createdAt).toBeInstanceOf(Date);
      expect(model.updatedAt).toBeInstanceOf(Date);
    });

    it("should return a copy of fields array", () => {
      const model = ContentModel.create("BlogPost", "Description", [
        titleField,
      ]);

      const fields = model.fields;
      fields.push(contentField);

      // Original model should not be affected
      expect(model.fields.length).toBe(1);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete content model lifecycle", () => {
      // Create initial model
      const model = ContentModel.create(
        "BlogPost",
        "Initial blog post schema",
        [titleField, contentField]
      );

      expect(model.fields.length).toBe(2);

      // Add more fields
      model.addField(FieldDefinition.create("author", FieldType.STRING, true));
      model.addField(
        FieldDefinition.create("tags", FieldType.STRING, false, undefined, {
          maxLength: 50,
        })
      );
      model.addField(
        FieldDefinition.create("published", FieldType.BOOLEAN, false, false)
      );

      expect(model.fields.length).toBe(5);

      // Update a field
      const updatedTitleField = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        undefined,
        {minLength: 10, maxLength: 150}
      );
      model.updateField("title", updatedTitleField);

      // Remove a field
      model.removeField("tags");

      expect(model.fields.length).toBe(4);

      // Update model info
      model.updateInfo("Article", "Enhanced article schema");

      expect(model.name).toBe("Article");
      expect(model.description).toBe("Enhanced article schema");

      // Validate content against the model
      const validContent = {
        title: "My Article Title",
        content: "Article content",
        author: "John Doe",
        published: true,
      };

      const result = model.validateContentData(validContent);
      expect(result.valid).toBe(true);

      // Validate invalid content
      const invalidContent = {
        title: "Short", // Too short now (minLength: 10)
        content: "Content",
        author: "John",
      };

      const invalidResult = model.validateContentData(invalidContent);
      expect(invalidResult.valid).toBe(false);
    });

    it("should prevent creating invalid models", () => {
      // Duplicate fields
      const field1 = FieldDefinition.create("name", FieldType.STRING, true);
      const field2 = FieldDefinition.create("name", FieldType.TEXT, true);

      expect(() =>
        ContentModel.create("Model", "Description", [field1, field2])
      ).toThrow();

      // No fields
      expect(() => ContentModel.create("Model", "Description", [])).toThrow();

      // Empty name
      expect(() => ContentModel.create("", "Description", [field1])).toThrow();
    });

    it("should maintain referential integrity during field operations", () => {
      const model = ContentModel.create("Product", "Product schema", [
        FieldDefinition.create("name", FieldType.STRING, true),
        FieldDefinition.create("price", FieldType.NUMBER, true),
        FieldDefinition.create("description", FieldType.TEXT, false),
      ]);

      // Add and immediately remove a field
      model.addField(
        FieldDefinition.create("tempField", FieldType.STRING, false)
      );
      expect(model.fields.length).toBe(4);

      model.removeField("tempField");
      expect(model.fields.length).toBe(3);

      // Ensure original fields are intact
      expect(model.getField("name")).toBeDefined();
      expect(model.getField("price")).toBeDefined();
      expect(model.getField("description")).toBeDefined();
    });
  });
});
