import {expect} from "chai";
import path from "path";
import templating from "./templating.js";

describe("Templating Engine", () => {
  describe("parseMetaTags", () => {
    it("should parse meta tags from content", () => {
      const content = [
        "<!-- @title:Home Page -->",
        "<!-- @layout:main -->",
        "Some content",
      ].join("\n");

      const meta = templating.parseMetaTags(content);
      expect(meta).to.be.an("object");
      expect(meta.title).to.equal("Home Page");
      expect(meta.layout).to.equal("main");
    });

    it("should return empty object when no meta tags", () => {
      const content = "Just some content\nwithout meta tags";
      const meta = templating.parseMetaTags(content);
      expect(meta).to.be.an("object");
      expect(Object.keys(meta)).to.have.length(0);
    });
  });

  describe("renderTemplate", () => {
    it("should replace variables in template", () => {
      const template = "Hello {{name}}! The year is {{year}}.";
      const variables = {
        name: "John",
        year: 2014,
      };

      const result = templating.renderTemplate(template, variables);
      expect(result).to.equal("Hello John! The year is 2014.");
    });

    it("should process conditional blocks correctly", () => {
      const template = [
        "Start",
        "<!-- @if:showGreeting -->",
        "Hello!",
        "<!-- @endif -->",
        "End",
      ].join("\n");

      const resultTrue = templating.renderTemplate(template, {
        showGreeting: true,
      });
      const resultFalse = templating.renderTemplate(template, {
        showGreeting: false,
      });

      expect(resultTrue).to.include("Hello!");
      expect(resultFalse).to.not.include("Hello!");
    });
  });
});
