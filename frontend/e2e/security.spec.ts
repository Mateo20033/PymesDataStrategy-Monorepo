import { test, expect } from "@playwright/test";
import { BasePage } from "./base-page";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

/**
 * Security tests for HTTP headers and file upload validation
 */

test.describe("Security Headers", () => {
  test("should have X-Frame-Options header set to DENY",
    { tag: ["@critical", "@e2e", "@security", "@SECURITY-E2E-001"] },
    async ({ page }) => {
      const response = await page.goto("/");
      const headers = response?.headers() ?? {};
      
      expect(headers["x-frame-options"]).toBe("DENY");
    }
  );

  test("should have X-Content-Type-Options header set to nosniff",
    { tag: ["@critical", "@e2e", "@security", "@SECURITY-E2E-002"] },
    async ({ page }) => {
      const response = await page.goto("/");
      const headers = response?.headers() ?? {};
      
      expect(headers["x-content-type-options"]).toBe("nosniff");
    }
  );

  test("should have Content-Security-Policy header",
    { tag: ["@critical", "@e2e", "@security", "@SECURITY-E2E-003"] },
    async ({ page }) => {
      const response = await page.goto("/");
      const headers = response?.headers() ?? {};
      
      const csp = headers["content-security-policy"];
      expect(csp).toBeDefined();
      
      // Verify key CSP directives
      expect(csp).toContain("default-src");
      expect(csp).toContain("frame-ancestors 'none'");
    }
  );
});

test.describe("File Upload Validation", () => {
  /**
   * Helper to create a temporary test file
   */
  function createTempFile(name: string, content: string, sizeInBytes?: number): string {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, name);
    
    if (sizeInBytes) {
      // Create a file of specific size
      const buffer = Buffer.alloc(sizeInBytes, "x");
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, content);
    }
    
    return filePath;
  }

  /**
   * Cleanup temp file
   */
  function cleanupTempFile(filePath: string): void {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }

  test("should reject file uploads with invalid extensions (UI validation)",
    { tag: ["@critical", "@e2e", "@security", "@SECURITY-E2E-004"] },
    async ({ page }) => {
      await page.goto("/dashboard");
      
      // Create a test file with invalid extension
      const invalidFile = createTempFile("test.txt", "test content");
      
      try {
        // Get the file input
        const fileInput = page.locator('input[type="file"]');
        
        // Set the file
        await fileInput.setInputFiles(invalidFile);
        
        // Wait for validation to occur
        await page.waitForTimeout(300);
        
        // Check for error message
        const errorMessage = page.getByText(/Formato no válido/i);
        await expect(errorMessage).toBeVisible();
      } finally {
        cleanupTempFile(invalidFile);
      }
    }
  );

  test("should reject file uploads over 10MB (UI validation)",
    { tag: ["@critical", "@e2e", "@security", "@SECURITY-E2E-005"] },
    async ({ page }) => {
      await page.goto("/dashboard");
      
      // Create a file larger than 10MB (11MB)
      const largeFileSize = 11 * 1024 * 1024;
      const largeFile = createTempFile("large.csv", "", largeFileSize);
      
      try {
        // Get the file input
        const fileInput = page.locator('input[type="file"]');
        
        // Set the file
        await fileInput.setInputFiles(largeFile);
        
        // Wait for validation to occur
        await page.waitForTimeout(300);
        
        // Check for error message about file size
        const errorMessage = page.getByText(/excede el tamaño máximo/i);
        await expect(errorMessage).toBeVisible();
      } finally {
        cleanupTempFile(largeFile);
      }
    }
  );

  test("should accept valid CSV file upload",
    { tag: ["@high", "@e2e", "@security", "@SECURITY-E2E-006"] },
    async ({ page }) => {
      await page.goto("/dashboard");
      
      // Create a valid CSV file
      const validFile = createTempFile("valid.csv", "name,email\nJohn,john@test.com");
      
      try {
        // Get the file input
        const fileInput = page.locator('input[type="file"]');
        
        // Set the file
        await fileInput.setInputFiles(validFile);
        
        // Wait for upload to start
        await page.waitForTimeout(300);
        
        // Either we see upload progress or no validation error
        const errorMessage = page.getByText(/Formato no válido/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        // Valid file should not trigger format error
        expect(hasError).toBeFalsy();
      } finally {
        cleanupTempFile(validFile);
      }
    }
  );
});
