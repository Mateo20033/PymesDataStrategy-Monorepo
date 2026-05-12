import { test, expect } from "@playwright/test";
import { BasePage } from "./base-page";

class DashboardPage extends BasePage {
  readonly sidebar = this.page.locator("aside");
  readonly sidebarLogo = this.page.locator("aside").getByRole("link").first();
  readonly navDashboard = this.page.getByRole("link", { name: /Dashboard/i });
  readonly navConfiguracion = this.page.getByRole("link", {
    name: /Configuración/i,
  });
  readonly logoutButton = this.page.getByRole("button", {
    name: /Cerrar Sesión/i,
  });
  readonly panelTitle = this.page.getByRole("heading", {
    name: /Panel de Control/i,
  });
  readonly adminBadge = this.page.getByText("Administrador");
  readonly dropzoneArea = this.page.locator('[class*="border-dashed"]');
  readonly dropzoneText = this.page.getByText("Arrastra tu Excel aquí");
  readonly fileInput = this.page.locator('input[type="file"]');
  readonly selectFileButton = this.page.getByRole("button", {
    name: /Seleccionar Archivo/i,
  });
  readonly recentFilesHeading = this.page.getByRole("heading", {
    name: /Archivos Recientes/i,
  });
  readonly emptyState = this.page.getByText("No hay datasets cargados");

  async goto(): Promise<void> {
    await super.goto("/dashboard");
  }
}

test.describe("Dashboard Page", () => {
  test(
    "should display sidebar with logo, navigation and logout",
    { tag: ["@critical", "@e2e", "@dashboard", "@DASHBOARD-E2E-001"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(dashboardPage.sidebar).toBeVisible();
      await expect(dashboardPage.sidebar.getByText("Data")).toBeVisible();
      await expect(dashboardPage.sidebar.getByText("Strategy")).toBeVisible();
      await expect(dashboardPage.navDashboard).toBeVisible();
      await expect(dashboardPage.navConfiguracion).toBeVisible();
      await expect(dashboardPage.logoutButton).toBeVisible();
    }
  );

  test(
    "should display header with title",
    { tag: ["@high", "@e2e", "@dashboard", "@DASHBOARD-E2E-002"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(dashboardPage.panelTitle).toBeVisible();
      await expect(
        page.getByText("Sube tus archivos Excel para análisis estructurado.")
      ).toBeVisible();
    }
  );

  test(
    "should display FileDropzone area",
    { tag: ["@critical", "@e2e", "@dashboard", "@DASHBOARD-E2E-003"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(dashboardPage.dropzoneArea).toBeVisible();
      await expect(dashboardPage.dropzoneText).toBeVisible();
      await expect(dashboardPage.fileInput).toBeAttached();
      await expect(
        page.getByText("Máximo 50,000 registros (.xlsx)")
      ).toBeVisible();
      await expect(dashboardPage.selectFileButton).toBeVisible();
    }
  );

  test(
    "should display empty state for recent files for a new user",
    { tag: ["@high", "@e2e", "@dashboard", "@DASHBOARD-E2E-004"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(dashboardPage.recentFilesHeading).toBeVisible();
      await expect(dashboardPage.emptyState).toBeVisible();
    }
  );

  // TODO: Write a test that uploads a file and waits for it to be processed
  // to the point where the "Revisar Anomalías" button is visible.
  test.skip(
    "should show 'Revisar Anomalías' button for datasets awaiting review",
    { tag: ["@critical", "@e2E", "@dashboard", "@DASHBOARD-E2E-005"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      const reviewButtons = page.getByRole("button", {
        name: /Revisar Anomalías/i,
      });
      await expect(reviewButtons.first()).toBeVisible();
    }
  );

  // TODO: Write a test that uploads a file and waits for it to be processed
  // to the point where the "Revisar Anomalías" button is visible, then clicks it.
  test.skip(
    "should navigate to review page when 'Revisar Anomalías' clicked",
    { tag: ["@critical", "@e2e", "@dashboard", "@DASHBOARD-E2E-006"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      const reviewButtons = page.getByRole("button", {
        name: /Revisar Anomalías/i,
      });
      await reviewButtons.first().click();
      await expect(page).toHaveURL(/\/dashboard\/review\/[a-zA-Z0-9-]+/);
    }
  );

  test(
    "should navigate to login when logout clicked",
    { tag: ["@high", "@e2e", "@dashboard", "@DASHBOARD-E2E-007"] },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.logoutButton.click();
      await expect(page).toHaveURL(/\/login/);
    }
  );
});
