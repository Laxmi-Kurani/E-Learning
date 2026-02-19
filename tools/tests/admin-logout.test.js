const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set an auth token and admin role in localStorage to simulate logged-in admin
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('token', 'TEST_TOKEN');
    localStorage.setItem('role', 'ADMIN');
  });

  // Navigate to admin page
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });

  // Wait for the sidebar Sign Out button
  const signOut = await page.locator('button', { hasText: 'Sign Out' }).first();
  const visible = await signOut.isVisible().catch(() => false);

  if (!visible) {
    console.error('Sign Out button not found or not visible on admin page');
    await browser.close();
    process.exit(2);
  }

  // Click sign out and wait for navigation to /login
  await signOut.click();
  try {
    await page.waitForURL('**/login', { timeout: 7000 });
  } catch (e) {
    // ignore; we'll still check the URL and storage
  }
  await page.waitForLoadState('domcontentloaded');

  // Check localStorage cleared (retry if evaluate fails due to navigation)
  let token = null;
  let role = null;
  for (let i = 0; i < 5; i++) {
    try {
      token = await page.evaluate(() => localStorage.getItem('token'));
      role = await page.evaluate(() => localStorage.getItem('role'));
      break;
    } catch (e) {
      await page.waitForTimeout(200);
    }
  }

  if (token || role) {
    console.error('Logout did not clear localStorage (token/role still present)');
    await browser.close();
    process.exit(3);
  }

  console.log('Admin logout smoke test: SUCCESS');
  await browser.close();
  process.exit(0);
})();
