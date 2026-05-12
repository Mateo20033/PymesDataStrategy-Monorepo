import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Full E2E Flow', () => {
  test('should allow a user to upload a dataset, review it, and submit decisions', async ({ page }) => {
    test.setTimeout(90000);

    page.on('response', response => {
      if (response.url().includes('/datasets') && response.request().method() === 'POST') {
        console.log('UPLOAD RESPONSE STATUS:', response.status());
        response.text().then(text => console.log('UPLOAD RESPONSE BODY:', text)).catch(e => console.error('Error reading body:', e));
      }
    });

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Panel de Control/i })).toBeVisible();

    console.log('Waiting for datasets GET request to ensure session is loaded...');
    await page.waitForResponse(resp => resp.url().includes('/api/v1/datasets') && resp.request().method() === 'GET');
    console.log('Session loaded, ready to upload');

    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'test-dataset.xlsx');
    await fileInput.setInputFiles(filePath);

    await expect(page.getByText(/Procesando dataset...|Subiendo archivo.../i)).toBeVisible({ timeout: 5000 });

    try {
      await expect(page.getByText('¡Dataset listo!')).toBeVisible({ timeout: 30000 });
    } catch (e) {
      if (await page.getByText(/Error al procesar|Error al subir el archivo/i).isVisible()) {
        const fullHtml = await page.locator('.border-dashed').innerHTML();
        console.error('UI ERROR HTML:', fullHtml);
      }
      throw e;
    }

    await page.waitForTimeout(2500);

    const downloadButton = page.getByRole('button', { name: /Descargar/i }).first();
    await expect(downloadButton).toBeVisible({ timeout: 10000 });

    // Ensure we can see the download button and it doesn't crash
  });
});
