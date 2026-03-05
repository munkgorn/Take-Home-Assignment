import { test, expect } from '@playwright/test';
import { login, fillMeetingBasicFields, pickDate } from './helpers';

test.describe.serial('Meeting CRUD operations', () => {
  const meetingTitle = `E2E Meeting ${Date.now()}`;
  const updatedTitle = `${meetingTitle} Updated`;
  const candidateName = 'Jane Doe';
  const position = 'Senior Engineer';
  const meetingLink = 'https://zoom.us/j/1234567890';
  const description = 'Technical interview for the senior engineering position.';
  const notes = 'Prepare system design questions.';

  let meetingDetailUrl: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('create an online meeting with all fields', async ({ page }) => {
    await page.goto('/meetings/new');
    await expect(page.getByText('Schedule New Meeting')).toBeVisible();

    // Fill basic text fields
    await fillMeetingBasicFields(page, {
      title: meetingTitle,
      candidateName,
      position,
      meetingType: 'online',
      meetingLink,
      startTime: '10:00',
      endTime: '11:00',
      description,
      notes,
    });

    // Pick start date: pick day 15 of the current month
    await pickDate(page, 'Start Date', 15);
    // Pick end date: pick day 15 of the current month
    await pickDate(page, 'End Date', 15);

    // Submit the form
    await page.getByRole('button', { name: /create meeting/i }).click();

    // Should redirect to dashboard and show success toast
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.getByText(/meeting created successfully/i)).toBeVisible({ timeout: 10000 });

    // Search for the newly created meeting (pagination may hide it)
    await page.getByPlaceholder('Search meetings...').fill(meetingTitle);
    await expect(page.getByText(meetingTitle)).toBeVisible({ timeout: 10000 });
  });

  test('create an onsite meeting', async ({ page }) => {
    const onsiteTitle = `Onsite ${Date.now()}`;
    await page.goto('/meetings/new');

    await fillMeetingBasicFields(page, {
      title: onsiteTitle,
      candidateName: 'John Smith',
      position: 'Product Manager',
      meetingType: 'onsite',
      startTime: '14:00',
      endTime: '15:00',
    });

    // Pick dates
    await pickDate(page, 'Start Date', 20);
    await pickDate(page, 'End Date', 20);

    await page.getByRole('button', { name: /create meeting/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.getByText(/meeting created successfully/i)).toBeVisible({ timeout: 10000 });
    // Search for the newly created meeting (pagination may hide it)
    await page.getByPlaceholder('Search meetings...').fill(onsiteTitle);
    await expect(page.getByText(onsiteTitle)).toBeVisible({ timeout: 10000 });
  });

  test('view meeting detail page shows all fields', async ({ page }) => {
    // Navigate to dashboard and search for the meeting (avoid pagination)
    await page.goto('/');
    await page.getByPlaceholder('Search meetings...').fill(meetingTitle);
    await expect(page.getByText(meetingTitle)).toBeVisible({ timeout: 10000 });

    // Click on the meeting card to navigate to the detail page
    const card = page.locator('[data-slot="card"]', { hasText: meetingTitle }).first();
    await card.click();

    // Wait for navigation to the detail page
    await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    meetingDetailUrl = page.url();

    // Verify all meeting details are displayed
    await expect(page.getByText(meetingTitle)).toBeVisible();
    await expect(page.getByText(candidateName)).toBeVisible();
    await expect(page.getByText(position, { exact: true })).toBeVisible();
    await expect(page.getByText('online', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(meetingLink)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByText(notes)).toBeVisible();
    await expect(page.getByText('pending', { exact: true }).first()).toBeVisible();

    // Edit and Delete buttons should be present
    await expect(page.getByRole('link', { name: /edit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('edit meeting changes title and status', async ({ page }) => {
    // Navigate to the meeting detail page
    await page.goto(meetingDetailUrl || '/');
    if (!meetingDetailUrl) {
      // Fallback: find the meeting from the dashboard via search
      await page.getByPlaceholder('Search meetings...').fill(meetingTitle);
      await expect(page.getByText(meetingTitle)).toBeVisible({ timeout: 10000 });
      const card = page.locator('[data-slot="card"]', { hasText: meetingTitle }).first();
      await card.click();
      await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });
    }

    // Click the Edit link/button
    await page.getByRole('link', { name: /edit/i }).click();
    await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });
    await expect(page.getByText('Edit Meeting')).toBeVisible();

    // Update the title
    const titleInput = page.getByLabel('Title');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    // Change the status to confirmed (the status select only appears in edit mode)
    const statusSection = page.locator('form').locator('text=Status').locator('..');
    await statusSection.getByRole('combobox').click();
    await page.getByRole('option', { name: /confirmed/i }).click();

    // Submit
    await page.getByRole('button', { name: /update meeting/i }).click();

    // Should redirect back to the meeting detail page
    await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+$/, { timeout: 15000 });
    await expect(page.getByText(/meeting updated successfully/i)).toBeVisible({ timeout: 10000 });

    // Verify updated values on detail page
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText('confirmed')).toBeVisible();
  });

  test('delete meeting via cancel keeps it in the list', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search meetings...').fill(updatedTitle);
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });

    // Open dropdown menu on the meeting card
    const card = page.locator('[data-slot="card"]', { hasText: updatedTitle }).first();
    // The "..." menu trigger button
    const menuButton = card.getByRole('button').first();
    await menuButton.click({ force: true });

    // Click Delete in the dropdown
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // AlertDialog should appear
    await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Click Cancel to dismiss
    await page.getByRole('button', { name: /cancel/i }).click();

    // Meeting should still be in the list
    await expect(page.getByText(updatedTitle)).toBeVisible();
  });

  test('delete meeting via confirm removes it from the list', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search meetings...').fill(updatedTitle);
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });

    // Open dropdown menu on the meeting card
    const card = page.locator('[data-slot="card"]', { hasText: updatedTitle }).first();
    const menuButton = card.getByRole('button').first();
    await menuButton.click({ force: true });

    // Click Delete in the dropdown
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // AlertDialog should appear
    await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Success toast
    await expect(page.getByText(/meeting deleted/i)).toBeVisible({ timeout: 10000 });

    // Meeting should no longer appear in the list
    await expect(page.getByText(updatedTitle)).not.toBeVisible({ timeout: 10000 });
  });

  test('create meeting form validation prevents empty submission', async ({ page }) => {
    await page.goto('/meetings/new');
    await expect(page.getByText('Schedule New Meeting')).toBeVisible();

    // Click Create Meeting without filling anything
    await page.getByRole('button', { name: /create meeting/i }).click();

    // Zod validation messages should appear for required fields
    await expect(page.getByText(/title is required/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/candidate name is required/i)).toBeVisible();
    await expect(page.getByText(/position is required/i)).toBeVisible();

    // Should remain on the create page
    await expect(page).toHaveURL(/\/meetings\/new/);
  });

  test('delete meeting from detail page', async ({ page }) => {
    // First create a meeting to delete
    const deleteTitle = `Delete From Detail ${Date.now()}`;
    await page.goto('/meetings/new');
    await fillMeetingBasicFields(page, {
      title: deleteTitle,
      candidateName: 'Delete Candidate',
      position: 'Tester',
      meetingType: 'onsite',
      startTime: '09:00',
      endTime: '10:00',
    });
    await pickDate(page, 'Start Date', 18);
    await pickDate(page, 'End Date', 18);
    await page.getByRole('button', { name: /create meeting/i }).click();
    await page.waitForURL('/', { timeout: 15000 });

    // Navigate to its detail page via search
    await page.getByPlaceholder('Search meetings...').fill(deleteTitle);
    await expect(page.getByText(deleteTitle)).toBeVisible({ timeout: 10000 });
    const card = page.locator('[data-slot="card"]', { hasText: deleteTitle }).first();
    await card.click();
    await page.waitForURL(/\/meetings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Click the Delete button on the detail page (it triggers an AlertDialog)
    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.getByText(/meeting deleted/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(deleteTitle)).not.toBeVisible({ timeout: 10000 });
  });
});
