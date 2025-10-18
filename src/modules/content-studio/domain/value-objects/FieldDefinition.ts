/**
 * Value Object: FieldDefinition
 * Defines the schema for a field in a Content Model
 * Immutable structure with validation rules
 */

export enum FieldType {
  STRING = "string",
  TEXT = "text",
  RICHTEXT = "richtext",
  NUMBER = "number",
  DATE = "date",
  BOOLEAN = "boolean",
}

export interface FieldValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldDefinitionProps {
  fieldName: string;
  fieldType: FieldType;
  required: boolean;
  defaultValue?: string | number | boolean;
  validationRules?: FieldValidationRules;
}

export class FieldDefinition {
  private readonly props: FieldDefinitionProps;

  private constructor(props: FieldDefinitionProps) {
    this.validate(props);
    this.props = {...props};
  }

  static create(
    fieldName: string,
    fieldType: FieldType,
    required: boolean = false,
    defaultValue?: string | number | boolean,
    validationRules?: FieldValidationRules
  ): FieldDefinition {
    return new FieldDefinition({
      fieldName,
      fieldType,
      required,
      defaultValue,
      validationRules,
    });
  }

  static fromObject(obj: FieldDefinitionProps): FieldDefinition {
    return new FieldDefinition(obj);
  }

  private validate(props: FieldDefinitionProps): void {
    if (!props.fieldName || props.fieldName.trim().length === 0) {
      throw new Error("Field name is required");
    }

    if (!Object.values(FieldType).includes(props.fieldType)) {
      throw new Error(`Invalid field type: ${props.fieldType}`);
    }

    // Validate default value type matches field type
    if (props.defaultValue !== undefined) {
      this.validateValueType(props.fieldType, props.defaultValue);
    }
  }

  private validateValueType(
    fieldType: FieldType,
    value: string | number | boolean
  ): void {
    switch (fieldType) {
      case FieldType.STRING:
      case FieldType.TEXT:
      case FieldType.RICHTEXT:
      case FieldType.DATE:
        if (typeof value !== "string") {
          throw new Error(
            `Default value for ${fieldType} must be a string, got ${typeof value}`
          );
        }
        break;
      case FieldType.NUMBER:
        if (typeof value !== "number") {
          throw new Error(
            `Default value for ${fieldType} must be a number, got ${typeof value}`
          );
        }
        break;
      case FieldType.BOOLEAN:
        if (typeof value !== "boolean") {
          throw new Error(
            `Default value for ${fieldType} must be a boolean, got ${typeof value}`
          );
        }
        break;
    }
  }

  get fieldName(): string {
    return this.props.fieldName;
  }

  get fieldType(): FieldType {
    return this.props.fieldType;
  }

  get required(): boolean {
    return this.props.required;
  }

  get defaultValue(): string | number | boolean | undefined {
    return this.props.defaultValue;
  }

  get validationRules(): FieldValidationRules | undefined {
    return this.props.validationRules;
  }

  /**
   * Validates a value against this field definition
   */
  validateValue(value: any): {valid: boolean; error?: string} {
    // Check required
    if (
      this.required &&
      (value === undefined || value === null || value === "")
    ) {
      return {valid: false, error: `Field '${this.fieldName}' is required`};
    }

    // If not required and no value provided, it's valid
    if (
      !this.required &&
      (value === undefined || value === null || value === "")
    ) {
      return {valid: true};
    }

    // Type validation
    try {
      this.validateValueType(this.fieldType, value);
    } catch (error) {
      return {
        valid: false,
        error: `Field '${this.fieldName}': ${
          error instanceof Error ? error.message : "Invalid type"
        }`,
      };
    }

    // Validation rules
    if (this.validationRules) {
      const rules = this.validationRules;

      if (typeof value === "string") {
        if (rules.minLength && value.length < rules.minLength) {
          return {
            valid: false,
            error: `Field '${this.fieldName}' must be at least ${rules.minLength} characters`,
          };
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          return {
            valid: false,
            error: `Field '${this.fieldName}' must be at most ${rules.maxLength} characters`,
          };
        }
        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            return {
              valid: false,
              error: `Field '${this.fieldName}' does not match required pattern`,
            };
          }
        }
      }

      if (typeof value === "number") {
        if (rules.min !== undefined && value < rules.min) {
          return {
            valid: false,
            error: `Field '${this.fieldName}' must be at least ${rules.min}`,
          };
        }
        if (rules.max !== undefined && value > rules.max) {
          return {
            valid: false,
            error: `Field '${this.fieldName}' must be at most ${rules.max}`,
          };
        }
      }
    }

    return {valid: true};
  }

  toObject(): FieldDefinitionProps {
    return {...this.props};
  }

  equals(other: FieldDefinition): boolean {
    if (!other) return false;
    return (
      this.fieldName === other.fieldName &&
      this.fieldType === other.fieldType &&
      this.required === other.required &&
      this.defaultValue === other.defaultValue &&
      JSON.stringify(this.validationRules) ===
        JSON.stringify(other.validationRules)
    );
  }
}
