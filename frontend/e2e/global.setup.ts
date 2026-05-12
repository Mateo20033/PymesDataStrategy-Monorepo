import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const userFile = path.join(__dirname, '.auth', 'user.json');

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Ensure the auth directory exists
  const authDir = path.dirname(userFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Generate a unique email for each test run
  const email = `test.user.${Date.now()}@example.com`;
  const password = 'Password123!';
  const name = 'Test User';

  // Go to registration page
  await page.goto(`${baseURL}/register`);

  // Fill and submit registration form
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /Crear Cuenta/i }).click();

  // Wait for redirection to login page
  await page.waitForURL(`${baseURL}/login?registered=true`);

  // Fill and submit login form
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /Ingresar/i }).click();

  // Wait for redirection to dashboard and verify
  await page.waitForURL(`${baseURL}/dashboard`);
  
  // Save authentication state
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
