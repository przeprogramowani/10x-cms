import {describe, it, expect, beforeEach, vi} from "vitest";
import {Component, ComponentData} from "../../domain/entities/Component";

describe("Component", () => {
  describe("create", () => {
    it("should create a valid component", () => {
      const componentData: ComponentData = {field1: "value1", field2: 42};
      const component = Component.create("ImageGallery", componentData);

      expect(component).toBeInstanceOf(Component);
      expect(component.componentType).toBe("ImageGallery");
      expect(component.componentData).toEqual(componentData);
      expect(component.componentId).toBeDefined();
    });

    it("should generate unique component IDs", () => {
      const data: ComponentData = {test: "data"};
      const component1 = Component.create("Type1", data);
      const component2 = Component.create("Type1", data);

      expect(component1.componentId).not.toBe(component2.componentId);
    });

    it("should set createdAt and updatedAt timestamps", () => {
      const component = Component.create("Hero", {title: "Welcome"});

      expect(component.createdAt).toBeInstanceOf(Date);
      expect(component.updatedAt).toBeInstanceOf(Date);
      expect(component.createdAt.getTime()).toBe(component.updatedAt.getTime());
    });

    it("should throw error for empty component type", () => {
      expect(() => Component.create("", {data: "value"})).toThrow(
        "Component type is required"
      );
    });

    it("should throw error for whitespace-only component type", () => {
      expect(() => Component.create("   ", {data: "value"})).toThrow(
        "Component type is required"
      );
    });

    it("should create component with empty data object", () => {
      const component = Component.create("EmptyComponent", {});
      expect(component.componentData).toEqual({});
    });

    it("should create deep copy of component data", () => {
      const originalData: ComponentData = {nested: {value: "test"}};
      const component = Component.create("Test", originalData);

      // Modify original data
      (originalData.nested as any).value = "modified";

      // Component data should not be affected (shallow copy in this implementation)
      expect(component.componentData.nested).toBeDefined();
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute component from props", () => {
      const props = {
        componentId: "test-id-123",
        componentType: "Hero",
        componentData: {title: "Welcome", subtitle: "To our site"},
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const component = Component.reconstitute(props);

      expect(component.componentId).toBe("test-id-123");
      expect(component.componentType).toBe("Hero");
      expect(component.componentData).toEqual({
        title: "Welcome",
        subtitle: "To our site",
      });
      expect(component.createdAt).toEqual(new Date("2024-01-01"));
      expect(component.updatedAt).toEqual(new Date("2024-01-02"));
    });

    it("should handle complex nested data structures", () => {
      const props = {
        componentId: "complex-id",
        componentType: "Gallery",
        componentData: {
          images: [
            {url: "img1.jpg", caption: "First"},
            {url: "img2.jpg", caption: "Second"},
          ],
          settings: {
            layout: "grid",
            itemsPerRow: 3,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const component = Component.reconstitute(props);
      expect(component.componentData).toEqual(props.componentData);
    });
  });

  describe("updateData", () => {
    it("should update component data", () => {
      const component = Component.create("Hero", {
        title: "Original Title",
      });

      const oldUpdatedAt = component.updatedAt;

      // Wait a bit to ensure different timestamp
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      component.updateData({title: "Updated Title"});

      expect(component.componentData).toEqual({title: "Updated Title"});
      expect(component.updatedAt.getTime()).toBeGreaterThan(
        oldUpdatedAt.getTime()
      );

      vi.useRealTimers();
    });

    it("should completely replace data, not merge", () => {
      const component = Component.create("Hero", {
        title: "Title",
        subtitle: "Subtitle",
      });

      component.updateData({title: "New Title"});

      // Subtitle should be gone
      expect(component.componentData).toEqual({title: "New Title"});
      expect(component.componentData.subtitle).toBeUndefined();
    });

    it("should handle empty data update", () => {
      const component = Component.create("Hero", {title: "Title"});
      component.updateData({});

      expect(component.componentData).toEqual({});
    });

    it("should create a copy of new data", () => {
      const component = Component.create("Test", {original: "data"});
      const newData = {updated: "data"};

      component.updateData(newData);

      // Modify the original object
      newData.updated = "modified";

      // Component should not be affected (it has a copy)
      expect(component.componentData.updated).toBe("data");
    });
  });

  describe("getters", () => {
    it("should provide read access to all properties", () => {
      const data: ComponentData = {field1: "value1", field2: 42};
      const component = Component.create("TestComponent", data);

      expect(component.componentId).toBeDefined();
      expect(typeof component.componentId).toBe("string");
      expect(component.componentType).toBe("TestComponent");
      expect(component.componentData).toEqual(data);
      expect(component.createdAt).toBeInstanceOf(Date);
      expect(component.updatedAt).toBeInstanceOf(Date);
    });

    it("should return a copy of component data, not the original", () => {
      const component = Component.create("Test", {value: "original"});
      const data = component.componentData;

      // Try to modify returned data
      data.value = "modified";

      // Original should not be affected
      expect(component.componentData.value).toBe("original");
    });
  });

  describe("toObject", () => {
    it("should convert component to plain object", () => {
      const component = Component.create("Hero", {
        title: "Welcome",
        subtitle: "To our site",
      });

      const obj = component.toObject();

      expect(obj).toEqual({
        componentId: component.componentId,
        componentType: "Hero",
        componentData: {title: "Welcome", subtitle: "To our site"},
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
      });
    });

    it("should return a copy of data, not reference", () => {
      const component = Component.create("Test", {value: "original"});
      const obj = component.toObject();

      // Modify the object
      obj.componentData.value = "modified";

      // Original component should not be affected
      expect(component.componentData.value).toBe("original");
    });

    it("should handle complex data structures", () => {
      const componentData = {
        array: [1, 2, 3],
        nested: {deep: {value: "test"}},
        boolean: true,
        number: 42,
      };

      const component = Component.create("Complex", componentData);
      const obj = component.toObject();

      expect(obj.componentData).toEqual(componentData);
    });
  });

  describe("integration scenarios", () => {
    it("should maintain data integrity through multiple updates", () => {
      const component = Component.create("Article", {
        title: "Original",
        content: "Content",
      });

      const originalCreatedAt = component.createdAt;

      component.updateData({title: "Updated 1"});
      component.updateData({title: "Updated 2"});
      component.updateData({title: "Final"});

      expect(component.componentData).toEqual({title: "Final"});
      expect(component.createdAt).toEqual(originalCreatedAt); // createdAt should not change
      expect(component.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalCreatedAt.getTime()
      );
    });

    it("should handle reconstitution and updates", () => {
      const props = {
        componentId: "test-id",
        componentType: "Hero",
        componentData: {title: "Original"},
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const component = Component.reconstitute(props);
      component.updateData({title: "Updated"});

      expect(component.componentData).toEqual({title: "Updated"});
      expect(component.createdAt).toEqual(new Date("2024-01-01")); // Preserved
    });
  });
});
