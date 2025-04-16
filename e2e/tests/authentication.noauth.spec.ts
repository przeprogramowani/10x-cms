import {test, expect} from "@playwright/test";
import {LoginPage} from "../page-objects/LoginPage";
import {DashboardPage} from "../page-objects/DashboardPage";

test.describe("Authentication - No Auth", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(({page}) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("should allow a user to log in successfully", async ({page}) => {
    // Navigate to login page
    await loginPage.navigate();

    // Perform login
    await loginPage.login("10xadmin", "10xpassword");

    // Wait for navigation to complete and check assertions
    await dashboardPage.waitForLoadState("domcontentloaded");

    // Assertions
    await expect(page).toHaveURL(dashboardPage.url); // Check URL
    await expect(dashboardPage.welcomeMessage).toBeVisible(); // Check welcome message
    await expect(dashboardPage.welcomeMessage).toHaveText("Welcome to 10xCMS");
    await expect(dashboardPage.logoutButton).toBeVisible(); // Check logout button
  });
});
