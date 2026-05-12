import { test, expect } from "@playwright/test";
import { BasePage } from "./base-page";

class LandingPage extends BasePage {
  readonly heroHeadline = this.page.getByRole("heading", {
    name: /Limpia tus Datos/i,
  });
  readonly exclusiveBadge = this.page.getByText("EXCLUSIVO PARA PYMES EN BOGOTÁ");
  readonly ctaButton = this.page.getByRole("link", {
    name: /Inicia tu Transformación/i,
  });
  readonly description = this.page.getByText(
    /Deja de perder horas ordenando Excels manualmente/i
  );

  async goto(): Promise<void> {
    await super.goto("/");
  }
}

test.describe("Landing Page", () => {
  test(
    "should display hero section with headline and badge",
    { tag: ["@critical", "@e2e", "@landing", "@LANDING-E2E-001"] },
    async ({ page }) => {
      const landingPage = new LandingPage(page);
      await landingPage.goto();

      await expect(landingPage.heroHeadline).toBeVisible();
      await expect(landingPage.exclusiveBadge).toBeVisible();
      await expect(landingPage.description).toBeVisible();
      await expect(landingPage.ctaButton).toBeVisible();
    }
  );

  test(
    "should display description with border accent",
    { tag: ["@high", "@e2e", "@landing", "@LANDING-E2E-002"] },
    async ({ page }) => {
      const landingPage = new LandingPage(page);
      await landingPage.goto();

      const subheadline = page.locator("p.border-b-4");
      await expect(subheadline).toBeVisible();
      await expect(
        page.getByText(/Nuestro Agente de Inteligencia Artificial/i)
      ).toBeVisible();
    }
  );

  test(
    "should display 'Multiplica tu Valor.' in orange accent color",
    { tag: ["@medium", "@e2e", "@landing", "@LANDING-E2E-003"] },
    async ({ page }) => {
      const landingPage = new LandingPage(page);
      await landingPage.goto();

      const orangeSpan = page.locator("span.text-\\[\\#FF6B00\\]");
      await expect(orangeSpan.first()).toBeVisible();
      await expect(orangeSpan.first()).toHaveText("Multiplica tu Valor.");
    }
  );

  test(
    "should navigate to dashboard when CTA clicked",
    { tag: ["@critical", "@e2e", "@landing", "@LANDING-E2E-004"] },
    async ({ page }) => {
      const landingPage = new LandingPage(page);
      await landingPage.goto();
      await landingPage.ctaButton.click({ force: true });
      await landingPage.waitForNavigation(/\/dashboard/);
      await expect(page).toHaveURL(/\/dashboard/);
    }
  );

  test(
    "should have correct page title",
    { tag: ["@medium", "@e2e", "@landing", "@LANDING-E2E-005"] },
    async ({ page }) => {
      const landingPage = new LandingPage(page);
      await landingPage.goto();
      await expect(page).toHaveTitle(/PymesDataStrategy/);
    }
  );
});
