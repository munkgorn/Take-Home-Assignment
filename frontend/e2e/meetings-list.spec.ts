import { test, expect } from '@playwright/test';
import { login, fillMeetingBasicFields, pickDate } from './helpers';

test.describe('Meetings list - search, filter, and pagination', () => {
  // Seed data identifiers — use unique suffix to avoid pollution from previous runs
  const prefix = `List${Date.now()}`;
  const suffix = Date.now().toString().slice(-6);
  const meetings = [
    { title: `${prefix} Alpha Interview`, candidate: `Alice Johnson ${suffix}`, position: 'Designer', status: 'pending' },
    { title: `${prefix} Beta Review`, candidate: `Bob Williams ${suffix}`, position: 'Developer', status: 'confirmed' },
    { title: `${prefix} Gamma Screening`, candidate: `Charlie Brown ${suffix}`, position: 'Analyst', status: 'cancelled' },
  ];

  test.setTimeout(120000);

  test.beforeAll(async ({ browser }) => {
    // Seed meetings for this test suite by creating them via the UI
    const page = await browser.newPage();
    await login(page);

    for (const m of meetings) {
      await page.goto('/meetings/new');
      await expect(page.getByRole('heading', { name: 'Schedule New Meeting' })).toBeVisible();

      await fillMeetingBasicFields(page, {
        title: m.title,
        candidateName: m.candidate,
        position: m.position,
        meetingType: 'onsite',
        startTime: '10:00',
        endTime: '11:00',
      });

      await pickDate(page, 'Date', 15);

      await page.getByRole('button', { name: /create meeting/i }).click();
      await page.waitForURL('/', { timeout: 15000 });
      await expect(page.getByText(/meeting created successfully/i)).toBeVisible({ timeout: 10000 });
    }

    // Now update statuses for the non-pending meetings via their edit pages
    for (const m of meetings) {
      if (m.status === 'pending') continue;

      // Use search to find the specific meeting (avoids pagination issues)
      await page.goto('/');
      const searchInput = page.getByPlaceholder('Search meetings...');
      await searchInput.fill(m.title);
      await expect(page.getByText(m.title)).toBeVisible({ timeout: 10000 });

      // Navigate to the meeting card, then edit
      const card = page.locator('[data-slot="card"]', { hasText: m.title }).first();
      await card.click();
      await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
      await page.getByRole('link', { name: /edit/i }).click();
      await page.waitForURL(/\/edit$/, { timeout: 10000 });

      // Change status
      const statusSection = page.locator('form').locator('text=Status').locator('..');
      await statusSection.getByRole('combobox').click();
      const statusLabel = m.status.charAt(0).toUpperCase() + m.status.slice(1);
      await page.getByRole('option', { name: new RegExp(statusLabel, 'i') }).click();

      await page.getByRole('button', { name: /update meeting/i }).click();
      await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+$/, { timeout: 15000 });
      await expect(page.getByText(/meeting updated successfully/i)).toBeVisible({ timeout: 10000 });
    }

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard displays meetings list', async ({ page }) => {
    await expect(page.getByText('My Meetings')).toBeVisible();
    // Search by prefix to find all our seeded meetings
    const searchInput = page.getByPlaceholder('Search meetings...');
    await searchInput.fill(prefix);
    for (const m of meetings) {
      await expect(page.getByText(m.title)).toBeVisible({ timeout: 10000 });
    }
    await searchInput.clear();
  });

  test('search by candidate name filters meetings', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search meetings...');
    await searchInput.fill(meetings[0].candidate);

    // Wait for the filtered results to load
    await expect(page.getByText(meetings[0].title)).toBeVisible({ timeout: 10000 });

    // Other meetings should not be visible
    await expect(page.getByText(meetings[1].title)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(meetings[2].title)).not.toBeVisible({ timeout: 5000 });
  });

  test('search by title filters meetings', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search meetings...');
    await searchInput.fill(meetings[1].title);

    await expect(page.getByText(meetings[1].title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(meetings[0].title)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(meetings[2].title)).not.toBeVisible({ timeout: 5000 });
  });

  test('clear search shows all meetings again', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search meetings...');

    // First search to filter to a single meeting
    await searchInput.fill(meetings[0].candidate);
    await expect(page.getByText(meetings[0].title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(meetings[1].title)).not.toBeVisible({ timeout: 5000 });

    // Clear and search by prefix to find all seeded meetings (avoids pagination)
    await searchInput.fill(prefix);

    for (const m of meetings) {
      await expect(page.getByText(m.title)).toBeVisible({ timeout: 10000 });
    }
  });

  test('filter by pending status', async ({ page }) => {
    // Search by prefix to scope to our test meetings
    await page.getByPlaceholder('Search meetings...').fill(prefix);
    await expect(page.getByText(meetings[0].title)).toBeVisible({ timeout: 10000 });

    // Open the status filter select (shadcn/Radix Select)
    await page.getByRole('combobox', { name: /filter/i }).or(
      page.locator('button', { hasText: /all statuses/i })
    ).click();
    await page.getByRole('option', { name: /pending/i }).click();

    // The pending meeting should be visible
    await expect(page.getByText(meetings[0].title)).toBeVisible({ timeout: 10000 });

    // The confirmed and cancelled meetings should not appear
    await expect(page.getByText(meetings[1].title)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(meetings[2].title)).not.toBeVisible({ timeout: 5000 });
  });

  test('filter by confirmed status', async ({ page }) => {
    await page.getByPlaceholder('Search meetings...').fill(prefix);
    await page.getByRole('combobox', { name: /filter/i }).or(
      page.locator('button', { hasText: /all statuses/i })
    ).click();
    await page.getByRole('option', { name: /confirmed/i }).click();

    await expect(page.getByText(meetings[1].title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(meetings[0].title)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(meetings[2].title)).not.toBeVisible({ timeout: 5000 });
  });

  test('filter by cancelled status', async ({ page }) => {
    await page.getByPlaceholder('Search meetings...').fill(prefix);
    await page.getByRole('combobox', { name: /filter/i }).or(
      page.locator('button', { hasText: /all statuses/i })
    ).click();
    await page.getByRole('option', { name: /cancelled/i }).click();

    await expect(page.getByText(meetings[2].title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(meetings[0].title)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(meetings[1].title)).not.toBeVisible({ timeout: 5000 });
  });

  test('reset status filter to all shows all meetings', async ({ page }) => {
    // Search by prefix first to avoid pagination issues
    const searchInput = page.getByPlaceholder('Search meetings...');
    await searchInput.fill(prefix);

    // Apply a status filter
    await page.getByRole('combobox', { name: /filter/i }).or(
      page.locator('button', { hasText: /all statuses/i })
    ).click();
    await page.getByRole('option', { name: /pending/i }).click();

    // Verify filtered — only pending should show
    await expect(page.getByText(meetings[0].title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(meetings[1].title)).not.toBeVisible({ timeout: 5000 });

    // Reset to "All Statuses"
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /all statuses/i }).click();

    // All meetings should be visible again
    for (const m of meetings) {
      await expect(page.getByText(m.title)).toBeVisible({ timeout: 10000 });
    }
  });

  test('new meeting button navigates to create page', async ({ page }) => {
    await page.getByRole('link', { name: /new meeting/i }).click();
    await expect(page).toHaveURL(/\/meetings\/new/);
    await expect(page.getByRole('heading', { name: 'Schedule New Meeting' })).toBeVisible();
  });

  test('meeting cards show expected information', async ({ page }) => {
    // Search to find the specific meeting (avoid pagination)
    const searchInput = page.getByPlaceholder('Search meetings...');
    await searchInput.fill(meetings[0].title);
    await expect(page.getByText(meetings[0].title)).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-slot="card"]', { hasText: meetings[0].title }).first();
    await expect(card.getByText(meetings[0].candidate)).toBeVisible();
    await expect(card.getByText(meetings[0].position)).toBeVisible();
    await expect(card.getByText(meetings[0].status)).toBeVisible();
    await expect(card.getByText('onsite')).toBeVisible();
    await searchInput.clear();
  });

  test('search combined with status filter', async ({ page }) => {
    // Use the unique prefix to make sure only our seeded meetings match
    const searchInput = page.getByPlaceholder('Search meetings...');
    await searchInput.fill(prefix);

    // All three should be visible
    for (const m of meetings) {
      await expect(page.getByText(m.title)).toBeVisible({ timeout: 10000 });
    }

    // Now also filter by confirmed
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /confirmed/i }).click();

    // Only the confirmed meeting should remain
    await expect(page.getByText(meetings[1].title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(meetings[0].title)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(meetings[2].title)).not.toBeVisible({ timeout: 5000 });
  });
});
