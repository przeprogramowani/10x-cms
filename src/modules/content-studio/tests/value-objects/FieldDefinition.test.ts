import {describe, it, expect} from "vitest";
import {
  FieldDefinition,
  FieldType,
} from "../../domain/value-objects/FieldDefinition";

describe("FieldDefinition", () => {
  describe("create", () => {
    it("should create a valid field definition", () => {
      const field = FieldDefinition.create("title", FieldType.STRING, true);
      expect(field).toBeInstanceOf(FieldDefinition);
      expect(field.fieldName).toBe("title");
      expect(field.fieldType).toBe(FieldType.STRING);
      expect(field.required).toBe(true);
    });

    it("should create field with default value", () => {
      const field = FieldDefinition.create(
        "isActive",
        FieldType.BOOLEAN,
        false,
        true
      );
      expect(field.defaultValue).toBe(true);
    });

    it("should create field with validation rules", () => {
      const rules = {minLength: 5, maxLength: 100};
      const field = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        undefined,
        rules
      );
      expect(field.validationRules).toEqual(rules);
    });

    it("should throw error for empty field name", () => {
      expect(() => FieldDefinition.create("", FieldType.STRING, false)).toThrow(
        "Field name is required"
      );
    });

    it("should throw error for whitespace-only field name", () => {
      expect(() =>
        FieldDefinition.create("   ", FieldType.STRING, false)
      ).toThrow("Field name is required");
    });

    it("should throw error for invalid field type", () => {
      expect(() =>
        FieldDefinition.create("test", "INVALID" as FieldType, false)
      ).toThrow("Invalid field type: INVALID");
    });
  });

  describe("default value type validation", () => {
    it("should accept string default for STRING field", () => {
      const field = FieldDefinition.create(
        "title",
        FieldType.STRING,
        false,
        "default"
      );
      expect(field.defaultValue).toBe("default");
    });

    it("should accept string default for TEXT field", () => {
      const field = FieldDefinition.create(
        "description",
        FieldType.TEXT,
        false,
        "default text"
      );
      expect(field.defaultValue).toBe("default text");
    });

    it("should accept string default for RICHTEXT field", () => {
      const field = FieldDefinition.create(
        "content",
        FieldType.RICHTEXT,
        false,
        "<p>default</p>"
      );
      expect(field.defaultValue).toBe("<p>default</p>");
    });

    it("should accept string default for DATE field", () => {
      const field = FieldDefinition.create(
        "publishDate",
        FieldType.DATE,
        false,
        "2024-01-01"
      );
      expect(field.defaultValue).toBe("2024-01-01");
    });

    it("should accept number default for NUMBER field", () => {
      const field = FieldDefinition.create(
        "count",
        FieldType.NUMBER,
        false,
        42
      );
      expect(field.defaultValue).toBe(42);
    });

    it("should accept boolean default for BOOLEAN field", () => {
      const field = FieldDefinition.create(
        "isActive",
        FieldType.BOOLEAN,
        false,
        true
      );
      expect(field.defaultValue).toBe(true);
    });

    it("should throw error for number default on STRING field", () => {
      expect(() =>
        FieldDefinition.create("title", FieldType.STRING, false, 123 as any)
      ).toThrow("Default value for string must be a string");
    });

    it("should throw error for string default on NUMBER field", () => {
      expect(() =>
        FieldDefinition.create("count", FieldType.NUMBER, false, "123" as any)
      ).toThrow("Default value for number must be a number");
    });

    it("should throw error for number default on BOOLEAN field", () => {
      expect(() =>
        FieldDefinition.create("isActive", FieldType.BOOLEAN, false, 1 as any)
      ).toThrow("Default value for boolean must be a boolean");
    });
  });

  describe("validateValue", () => {
    describe("required field validation", () => {
      it("should fail validation for required field with no value", () => {
        const field = FieldDefinition.create("title", FieldType.STRING, true);
        const result = field.validateValue(undefined);
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Field 'title' is required");
      });

      it("should fail validation for required field with null", () => {
        const field = FieldDefinition.create("title", FieldType.STRING, true);
        const result = field.validateValue(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Field 'title' is required");
      });

      it("should fail validation for required field with empty string", () => {
        const field = FieldDefinition.create("title", FieldType.STRING, true);
        const result = field.validateValue("");
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Field 'title' is required");
      });

      it("should pass validation for optional field with no value", () => {
        const field = FieldDefinition.create("title", FieldType.STRING, false);
        const result = field.validateValue(undefined);
        expect(result.valid).toBe(true);
      });

      it("should pass validation for required field with valid value", () => {
        const field = FieldDefinition.create("title", FieldType.STRING, true);
        const result = field.validateValue("My Title");
        expect(result.valid).toBe(true);
      });
    });

    describe("string field validation", () => {
      it("should pass validation for valid string", () => {
        const field = FieldDefinition.create("title", FieldType.STRING, false);
        const result = field.validateValue("Valid Title");
        expect(result.valid).toBe(true);
      });

      it("should fail validation for string with minLength rule", () => {
        const field = FieldDefinition.create(
          "title",
          FieldType.STRING,
          false,
          undefined,
          {
            minLength: 5,
          }
        );
        const result = field.validateValue("abc");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("must be at least 5 characters");
      });

      it("should fail validation for string with maxLength rule", () => {
        const field = FieldDefinition.create(
          "title",
          FieldType.STRING,
          false,
          undefined,
          {
            maxLength: 10,
          }
        );
        const result = field.validateValue("This is a very long title");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("must be at most 10 characters");
      });

      it("should pass validation for string within length bounds", () => {
        const field = FieldDefinition.create(
          "title",
          FieldType.STRING,
          false,
          undefined,
          {
            minLength: 5,
            maxLength: 20,
          }
        );
        const result = field.validateValue("Valid Title");
        expect(result.valid).toBe(true);
      });

      it("should pass validation for string matching pattern", () => {
        const field = FieldDefinition.create(
          "email",
          FieldType.STRING,
          false,
          undefined,
          {
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          }
        );
        const result = field.validateValue("test@example.com");
        expect(result.valid).toBe(true);
      });

      it("should fail validation for string not matching pattern", () => {
        const field = FieldDefinition.create(
          "email",
          FieldType.STRING,
          false,
          undefined,
          {
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          }
        );
        const result = field.validateValue("invalid-email");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("does not match required pattern");
      });
    });

    describe("number field validation", () => {
      it("should pass validation for valid number", () => {
        const field = FieldDefinition.create("age", FieldType.NUMBER, false);
        const result = field.validateValue(25);
        expect(result.valid).toBe(true);
      });

      it("should fail validation for number below min", () => {
        const field = FieldDefinition.create(
          "age",
          FieldType.NUMBER,
          false,
          undefined,
          {
            min: 18,
          }
        );
        const result = field.validateValue(15);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("must be at least 18");
      });

      it("should fail validation for number above max", () => {
        const field = FieldDefinition.create(
          "age",
          FieldType.NUMBER,
          false,
          undefined,
          {
            max: 100,
          }
        );
        const result = field.validateValue(120);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("must be at most 100");
      });

      it("should pass validation for number within bounds", () => {
        const field = FieldDefinition.create(
          "age",
          FieldType.NUMBER,
          false,
          undefined,
          {
            min: 18,
            max: 100,
          }
        );
        const result = field.validateValue(25);
        expect(result.valid).toBe(true);
      });

      it("should pass validation for number at min boundary", () => {
        const field = FieldDefinition.create(
          "age",
          FieldType.NUMBER,
          false,
          undefined,
          {
            min: 18,
          }
        );
        const result = field.validateValue(18);
        expect(result.valid).toBe(true);
      });

      it("should pass validation for number at max boundary", () => {
        const field = FieldDefinition.create(
          "age",
          FieldType.NUMBER,
          false,
          undefined,
          {
            max: 100,
          }
        );
        const result = field.validateValue(100);
        expect(result.valid).toBe(true);
      });
    });

    describe("boolean field validation", () => {
      it("should pass validation for true", () => {
        const field = FieldDefinition.create(
          "isActive",
          FieldType.BOOLEAN,
          false
        );
        const result = field.validateValue(true);
        expect(result.valid).toBe(true);
      });

      it("should pass validation for false", () => {
        const field = FieldDefinition.create(
          "isActive",
          FieldType.BOOLEAN,
          false
        );
        const result = field.validateValue(false);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe("toObject", () => {
    it("should convert to plain object", () => {
      const field = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        "default",
        {
          minLength: 5,
        }
      );
      const obj = field.toObject();
      expect(obj).toEqual({
        fieldName: "title",
        fieldType: FieldType.STRING,
        required: true,
        defaultValue: "default",
        validationRules: {minLength: 5},
      });
    });
  });

  describe("fromObject", () => {
    it("should create field definition from object", () => {
      const obj = {
        fieldName: "title",
        fieldType: FieldType.STRING,
        required: true,
        defaultValue: "default",
        validationRules: {minLength: 5},
      };
      const field = FieldDefinition.fromObject(obj);
      expect(field.fieldName).toBe("title");
      expect(field.fieldType).toBe(FieldType.STRING);
      expect(field.required).toBe(true);
      expect(field.defaultValue).toBe("default");
      expect(field.validationRules).toEqual({minLength: 5});
    });
  });

  describe("equals", () => {
    it("should return true for equal field definitions", () => {
      const field1 = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        "default",
        {
          minLength: 5,
        }
      );
      const field2 = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        "default",
        {
          minLength: 5,
        }
      );
      expect(field1.equals(field2)).toBe(true);
    });

    it("should return false for different field names", () => {
      const field1 = FieldDefinition.create("title", FieldType.STRING, true);
      const field2 = FieldDefinition.create("name", FieldType.STRING, true);
      expect(field1.equals(field2)).toBe(false);
    });

    it("should return false for different field types", () => {
      const field1 = FieldDefinition.create("title", FieldType.STRING, true);
      const field2 = FieldDefinition.create("title", FieldType.TEXT, true);
      expect(field1.equals(field2)).toBe(false);
    });

    it("should return false for different required flags", () => {
      const field1 = FieldDefinition.create("title", FieldType.STRING, true);
      const field2 = FieldDefinition.create("title", FieldType.STRING, false);
      expect(field1.equals(field2)).toBe(false);
    });

    it("should return false for different default values", () => {
      const field1 = FieldDefinition.create(
        "title",
        FieldType.STRING,
        false,
        "default1"
      );
      const field2 = FieldDefinition.create(
        "title",
        FieldType.STRING,
        false,
        "default2"
      );
      expect(field1.equals(field2)).toBe(false);
    });

    it("should return false for different validation rules", () => {
      const field1 = FieldDefinition.create(
        "title",
        FieldType.STRING,
        false,
        undefined,
        {
          minLength: 5,
        }
      );
      const field2 = FieldDefinition.create(
        "title",
        FieldType.STRING,
        false,
        undefined,
        {
          minLength: 10,
        }
      );
      expect(field1.equals(field2)).toBe(false);
    });

    it("should return false for null", () => {
      const field = FieldDefinition.create("title", FieldType.STRING, false);
      expect(field.equals(null as any)).toBe(false);
    });
  });

  describe("getters", () => {
    it("should provide access to all properties", () => {
      const field = FieldDefinition.create(
        "title",
        FieldType.STRING,
        true,
        "default",
        {
          minLength: 5,
          maxLength: 100,
        }
      );
      expect(field.fieldName).toBe("title");
      expect(field.fieldType).toBe(FieldType.STRING);
      expect(field.required).toBe(true);
      expect(field.defaultValue).toBe("default");
      expect(field.validationRules).toEqual({minLength: 5, maxLength: 100});
    });
  });
});
