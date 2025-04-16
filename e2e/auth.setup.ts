import {test as setup} from "@playwright/test";

const authFile = "./e2e/.auth/user.json";

setup("authenticate", async ({page}) => {
  // Get credentials from environment variables
  const username = "10xadmin";
  const password = "10xpassword";

  // Navigate to login page
  await page.goto("/login");

  // Perform login
  // TODO: Ensure these selectors and environment variables are correct
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');

  // Wait for successful login
  await page.waitForURL("/home");

  // Save signed-in state to the specified path
  await page.context().storageState({
    path: authFile,
  });
});
