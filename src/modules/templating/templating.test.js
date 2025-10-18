import {describe, it, expect} from "vitest";
import templatingService from "./templating.service.js";

describe("Templating Engine", () => {
  describe("parseMetaTags", () => {
    it("should parse meta tags from content", () => {
      const content = [
        "<!-- @title:Home Page -->",
        "<!-- @layout:main -->",
        "Some content",
      ].join("\n");

      const meta = templatingService.parseMetaTags(content);
      expect(meta).toBeTypeOf("object");
      expect(meta.title).toBe("Home Page");
      expect(meta.layout).toBe("main");
    });

    it("should return empty object when no meta tags", () => {
      const content = "Just some content\nwithout meta tags";
      const meta = templatingService.parseMetaTags(content);
      expect(meta).toBeTypeOf("object");
      expect(Object.keys(meta)).toHaveLength(0);
    });
  });

  describe("renderTemplate", () => {
    it("should replace variables in template", () => {
      const template = "Hello {{name}}! The year is {{year}}.";
      const variables = {
        name: "John",
        year: 2014,
      };

      const result = templatingService.renderTemplate(template, variables);
      expect(result).toBe("Hello John! The year is 2014.");
    });

    it("should process conditional blocks correctly", () => {
      const template = [
        "Start",
        "<!-- @if:showGreeting -->",
        "Hello!",
        "<!-- @endif -->",
        "End",
      ].join("\n");

      const resultTrue = templatingService.renderTemplate(template, {
        showGreeting: true,
      });
      const resultFalse = templatingService.renderTemplate(template, {
        showGreeting: false,
      });

      expect(resultTrue).toContain("Hello!");
      expect(resultFalse).not.toContain("Hello!");
    });
  });
});
