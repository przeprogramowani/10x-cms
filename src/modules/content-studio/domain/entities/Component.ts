import {randomUUID} from "crypto";

/**
 * Entity: Component
 * Represents a reusable content component
 * For future implementation of component-based content authoring
 */

export interface ComponentData {
  [key: string]: any;
}

export interface ComponentProps {
  componentId: string;
  componentType: string;
  componentData: ComponentData;
  createdAt: Date;
  updatedAt: Date;
}

export class Component {
  private props: ComponentProps;

  private constructor(props: ComponentProps) {
    this.props = props;
  }

  static create(
    componentType: string,
    componentData: ComponentData
  ): Component {
    if (!componentType || componentType.trim().length === 0) {
      throw new Error("Component type is required");
    }

    const now = new Date();
    return new Component({
      componentId: randomUUID(),
      componentType,
      componentData: {...componentData},
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ComponentProps): Component {
    return new Component(props);
  }

  get componentId(): string {
    return this.props.componentId;
  }

  get componentType(): string {
    return this.props.componentType;
  }

  get componentData(): ComponentData {
    return {...this.props.componentData};
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateData(newData: ComponentData): void {
    this.props.componentData = {...newData};
    this.props.updatedAt = new Date();
  }

  toObject(): ComponentProps {
    return {
      componentId: this.props.componentId,
      componentType: this.props.componentType,
      componentData: {...this.props.componentData},
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
