import fs from "fs";
import path from "path";
import type { Request } from "express";

interface MetaTags {
  [key: string]: string;
}

interface TemplateVariables {
  [key: string]: string | number | boolean;
}

const readFileSync = (filepath: string): string | null => {
  try {
    return fs.readFileSync(filepath, "utf8");
  } catch (err) {
    console.error("Error reading file:", filepath, err);
    return null;
  }
};

const parseMetaTags = (content: string): MetaTags => {
  const meta: MetaTags = {};
  const lines = content.split("\n");

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("<!-- @")) {
      const tag = trimmedLine.replace("<!-- @", "").replace(" -->", "");
      const parts = tag.split(":");
      if (parts.length === 2) {
        meta[parts[0] as string] = parts[1] as string;
      }
    }
  });

  return meta;
};

const injectComponent = (
  content: string,
  componentName: string,
  variables: TemplateVariables
): string => {
  const componentPath = path.join(
    process.cwd(),
    "src/components",
    `${componentName}.html`
  );
  let componentContent = readFileSync(componentPath);
  if (!componentContent) {
    return content;
  }

  // Process the component content with variables before injecting
  componentContent = renderTemplate(componentContent, variables);

  return content.replace(
    `<!-- @inject:${componentName} -->`,
    componentContent
  );
};

const renderWithLayout = (
  content: string,
  layoutName: string,
  variables: TemplateVariables
): string => {
  const layoutPath = path.join(process.cwd(), "src/layout", `${layoutName}.html`);
  let layoutContent = readFileSync(layoutPath);
  if (!layoutContent) {
    return content;
  }

  layoutContent = layoutContent.replace("<!-- @content -->", content);

  // Pass variables to component injections
  layoutContent = injectComponent(layoutContent, "topbar", variables);
  layoutContent = injectComponent(layoutContent, "footer", variables);

  return renderTemplate(layoutContent, variables);
};

const processConditionals = (
  content: string,
  variables: TemplateVariables
): string => {
  // Process if conditions
  const ifRegex = /<!-- @if:(\w+) -->([\s\S]*?)<!-- @endif -->/g;
  let match;

  while ((match = ifRegex.exec(content)) !== null) {
    const condition = match[1];
    const conditionalContent = match[2];

    // Check if the condition variable exists and is truthy
    if (condition && variables[condition]) {
      // Replace the entire conditional block with just the content
      content = content.replace(match[0], conditionalContent ?? "");
    } else {
      // Remove the entire conditional block
      content = content.replace(match[0], "");
    }
  }

  return content;
};

const renderTemplate = (
  template: string,
  variables: TemplateVariables
): string => {
  let content = template;

  // First process conditionals
  content = processConditionals(content, variables);

  // Then replace variables
  Object.keys(variables).forEach((key) => {
    if (
      typeof variables[key] === "string" ||
      typeof variables[key] === "number"
    ) {
      content = content.replace(
        new RegExp(`{{${key}}}`, "g"),
        String(variables[key])
      );
    }
  });

  return content;
};

const renderPage = (
  pageName: string,
  req: Request,
  customVariables?: TemplateVariables
): string | null => {
  const pagePath = path.join(process.cwd(), "src/pages", `${pageName}.html`);
  let content = readFileSync(pagePath);

  if (!content) {
    return null;
  }

  const meta = parseMetaTags(content);
  const variables: TemplateVariables = {
    title: meta["title"] || "10xCMS",
    currentYear: new Date().getFullYear(),
    // Add authentication status if request object is provided
    isAuthenticated: req && req.cookies && req.cookies["auth"] ? true : false,
    // Merge custom variables if provided
    ...customVariables,
  };

  content = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("<!-- @"))
    .join("\n");

  if (meta["layout"]) {
    content = renderWithLayout(content, meta["layout"], variables);
  }

  return content;
};

export default {
  renderPage,
  renderTemplate,
  renderWithLayout,
  parseMetaTags,
};
