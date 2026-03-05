import { Page } from '@playwright/test';

export const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

export async function login(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/');
}

/**
 * Register a new user account and auto-sign-in.
 * Returns the credentials used.
 */
export async function registerUser(
  page: Page,
  overrides: { name?: string; email?: string; password?: string } = {}
) {
  const user = {
    name: overrides.name ?? `User ${Date.now()}`,
    email: overrides.email ?? `user-${Date.now()}@example.com`,
    password: overrides.password ?? 'password123',
  };

  await page.goto('/register');
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: /create account/i }).click();

  return user;
}

/**
 * Fill the meeting form fields that are simple text/select inputs.
 * Date pickers require separate handling.
 */
export async function fillMeetingBasicFields(
  page: Page,
  data: {
    title: string;
    candidateName: string;
    position: string;
    meetingType?: 'onsite' | 'online';
    meetingLink?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    notes?: string;
  }
) {
  // Text fields
  await page.getByLabel('Title').fill(data.title);
  await page.getByLabel('Candidate Name').fill(data.candidateName);
  await page.getByLabel('Position').fill(data.position);

  // Meeting type select
  if (data.meetingType) {
    const meetingTypeLabel = data.meetingType === 'online' ? 'Online' : 'Onsite';
    // The meeting type is a shadcn Select inside a FormField labeled "Meeting Type"
    const meetingTypeSection = page.locator('form').locator('text=Meeting Type').locator('..');
    await meetingTypeSection.getByRole('combobox').click();
    await page.getByRole('option', { name: meetingTypeLabel }).click();
  }

  // Meeting link (only visible when online)
  if (data.meetingLink) {
    await page.getByLabel('Meeting Link').fill(data.meetingLink);
  }

  // Time inputs
  if (data.startTime) {
    await page.getByLabel('Start Time').fill(data.startTime);
  }
  if (data.endTime) {
    await page.getByLabel('End Time').fill(data.endTime);
  }

  // Optional textareas
  if (data.description) {
    await page.getByLabel('Description').fill(data.description);
  }
  if (data.notes) {
    await page.getByLabel('Notes').fill(data.notes);
  }
}

/**
 * Pick a date in the shadcn Calendar popover.
 * Opens the popover via the trigger button, then selects a day.
 */
export async function pickDate(page: Page, label: string, dayNumber: number) {
  // The date picker is a Popover triggered by a button inside a FormField.
  // The FormLabel text matches `label` (e.g. "Start Date", "End Date").
  const formItem = page.locator('form').locator(`text=${label}`).locator('..');
  const trigger = formItem.getByRole('button');
  await trigger.click();

  // The calendar popover uses data-slot="popover-content" (Radix Popover).
  // Day buttons are rendered inside <td> (gridcell) elements by react-day-picker.
  const popover = page.locator('[data-slot="popover-content"]').last();
  await popover.waitFor({ state: 'visible', timeout: 5000 });

  // Click the day button matching the number.
  // react-day-picker renders <td> with <button> inside. Use text matching.
  // Exclude "outside" days (previous/next month) by filtering out td with data-outside.
  await popover
    .locator('td:not([data-outside]) > button', { hasText: new RegExp(`^${dayNumber}$`) })
    .first()
    .click();
}
