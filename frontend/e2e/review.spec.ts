import { test, expect } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * Review Page Object Model
 * Updated for grid-based anomaly card layout (all cards visible at once)
 */
class ReviewPage extends BasePage {
  // Navigation
  readonly backButton = this.page.getByRole("button", {
    name: /← Volver al Dashboard/i,
  });

  // Blue banner
  readonly banner = this.page.locator(".bg-\\[\\#0033A0\\]").first();
  readonly bannerTitle = this.page.getByRole("heading", {
    name: /Revisión de IA/i,
  });
  readonly pendingCounter = this.page.getByText(/Pendientes/i);

  // Anomaly cards — grid of all anomalies
  readonly anomalyCards = this.page.locator(
    ".bg-white.border-2.border-black"
  ).filter({ hasText: "Anomalía Detectada" });

  // Action buttons (on any card)
  readonly approveButtons = this.page.getByRole("button", {
    name: /Aprobar Regla/i,
  });
  readonly discardButtons = this.page.getByRole("button", {
    name: /Descartar/i,
  });
  readonly editButtons = this.page.getByRole("button", { name: /Editar/i });
  readonly undoButtons = this.page.getByRole("button", {
    name: /Deshacer Acción/i,
  });

  // ETL submit button (appears when all resolved)
  readonly etlButton = this.page.getByRole("button", {
    name: /Ejecutar Motor ETL/i,
  });

  // Empty state
  readonly noAnomaliesMessage = this.page.getByText(
    "No se detectaron anomalías en este dataset."
  );

  async goto(datasetId: string): Promise<void> {
    await super.goto(`/dashboard/review/${datasetId}`);
  }
}

// Uses mock service data
const TEST_DATASET_ID = "ds-001";

test.describe.skip("Review Page", () => {
  test(
    "should display back button and blue banner with dataset info",
    { tag: ["@critical", "@e2e", "@review", "@REVIEW-E2E-001"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      // Verify back button
      await expect(reviewPage.backButton).toBeVisible();

      // Verify blue banner
      await expect(reviewPage.banner).toBeVisible();
      await expect(reviewPage.bannerTitle).toBeVisible();

      // Verify pending counter
      await expect(reviewPage.pendingCounter).toBeVisible();
    }
  );

  test(
    "should display banner description about AI agent",
    { tag: ["@high", "@e2e", "@review", "@REVIEW-E2E-002"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      await expect(
        page.getByText(
          /El Agente IA ha perfilado los datos y sugiere las siguientes reglas/i
        )
      ).toBeVisible();
    }
  );

  test(
    "should display grid of anomaly cards with column badges",
    { tag: ["@critical", "@e2e", "@review", "@REVIEW-E2E-003"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      // If there are anomalies, verify cards
      const cardCount = await reviewPage.anomalyCards.count();

      if (cardCount > 0) {
        // Verify column badge on first card
        await expect(page.getByText(/Columna:/).first()).toBeVisible();

        // Verify "Anomalía Detectada" label
        await expect(
          page.getByText("Anomalía Detectada").first()
        ).toBeVisible();

        // Verify "Sugerencia IA" section
        await expect(page.getByText("Sugerencia IA").first()).toBeVisible();
      } else {
        // Empty state
        await expect(reviewPage.noAnomaliesMessage).toBeVisible();
      }
    }
  );

  test(
    "should display action buttons on pending anomaly cards",
    { tag: ["@critical", "@e2e", "@review", "@REVIEW-E2E-004"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      const hasApproveButton = await reviewPage.approveButtons
        .first()
        .isVisible()
        .catch(() => false);

      if (hasApproveButton) {
        // Verify all three action buttons exist
        await expect(reviewPage.approveButtons.first()).toBeVisible();
        await expect(reviewPage.discardButtons.first()).toBeVisible();
        await expect(reviewPage.editButtons.first()).toBeVisible();
      }
    }
  );

  test(
    "should approve an anomaly and show undo button",
    { tag: ["@critical", "@e2e", "@review", "@REVIEW-E2E-005"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      const hasApproveButton = await reviewPage.approveButtons
        .first()
        .isVisible()
        .catch(() => false);

      if (hasApproveButton) {
        // Click approve on first card
        await reviewPage.approveButtons.first().click();

        // Wait for state update
        await page.waitForTimeout(300);

        // After approving, an "Deshacer Acción" button should appear
        await expect(reviewPage.undoButtons.first()).toBeVisible();
      }
    }
  );

  test(
    "should discard an anomaly and show undo button",
    { tag: ["@high", "@e2e", "@review", "@REVIEW-E2E-006"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      const hasDiscardButton = await reviewPage.discardButtons
        .first()
        .isVisible()
        .catch(() => false);

      if (hasDiscardButton) {
        // Click discard on first card
        await reviewPage.discardButtons.first().click();

        // Wait for state update
        await page.waitForTimeout(300);

        // After discarding, an "Deshacer Acción" button should appear
        await expect(reviewPage.undoButtons.first()).toBeVisible();
      }
    }
  );

  test(
    "should undo an action and restore pending state",
    { tag: ["@high", "@e2e", "@review", "@REVIEW-E2E-007"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      const hasApproveButton = await reviewPage.approveButtons
        .first()
        .isVisible()
        .catch(() => false);

      if (hasApproveButton) {
        // Get initial approve button count
        const initialCount = await reviewPage.approveButtons.count();

        // Approve first card
        await reviewPage.approveButtons.first().click();
        await page.waitForTimeout(300);

        // Click undo
        await reviewPage.undoButtons.first().click();
        await page.waitForTimeout(300);

        // Approve buttons should be restored
        const restoredCount = await reviewPage.approveButtons.count();
        expect(restoredCount).toBe(initialCount);
      }
    }
  );

  test(
    "should navigate back to dashboard",
    { tag: ["@high", "@e2e", "@review", "@REVIEW-E2E-008"] },
    async ({ page }) => {
      const reviewPage = new ReviewPage(page);

      await reviewPage.goto(TEST_DATASET_ID);
      await page.waitForTimeout(500);

      // Click back button
      await reviewPage.backButton.click();

      // Verify navigation to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    }
  );
});
