import { test, expect } from '@playwright/test';
import { TEST_USER, login, registerUser } from './helpers';

test.describe('Authentication', () => {
  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/');
    // The middleware should redirect to /login with a callbackUrl param
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated users from meetings/new to login', async ({ page }) => {
    await page.goto('/meetings/new');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-slot="card-title"]', { hasText: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    // Dashboard heading should be visible
    await expect(page.getByText('My Meetings')).toBeVisible();
  });

  test('login with wrong password shows error toast', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Sonner toast with error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 });
    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('login form requires fields (browser validation)', async ({ page }) => {
    await page.goto('/login');
    // Click submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();

    // The form uses native `required` attributes, so the browser should prevent submission.
    // We verify we're still on the login page.
    await expect(page).toHaveURL(/\/login/);
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('[data-slot="card-title"]', { hasText: /create account/i })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('register new user auto-signs-in and redirects to dashboard', async ({ page }) => {
    const user = await registerUser(page);

    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).toHaveURL('/');
    // The success toast should appear
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: 10000 });
    // The user name or email should appear in the header
    await expect(page.getByText(user.name)).toBeVisible();
  });

  test('register with existing email shows error', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Duplicate User');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show an error toast (registration failed or email already exists)
    await expect(
      page.getByText(/already|exists|failed|registered/i)
    ).toBeVisible({ timeout: 10000 });
    // Should remain on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('sign out redirects to login page', async ({ page }) => {
    // First login
    await login(page);
    await expect(page).toHaveURL('/');

    // Click the Sign Out button in the dashboard layout header
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('navigate from login to register via link', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('navigate from register to login via link', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('profile page displays user info', async ({ page }) => {
    await login(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByText('Account Information')).toBeVisible();
    await expect(page.getByTestId('profile-name')).toHaveText(TEST_USER.name);
    await expect(page.getByTestId('profile-email')).toHaveText(TEST_USER.email);
  });

  test('navigate to profile from header link', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    await page.getByRole('link', { name: TEST_USER.name }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('change password with wrong current password shows error', async ({ page }) => {
    await login(page);
    await page.goto('/profile');
    await page.getByLabel('Current Password').fill('wrongpassword');
    await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm New Password').fill('newpassword123');
    await page.getByRole('button', { name: /change password/i }).click();
    await expect(page.getByText(/current password is incorrect/i)).toBeVisible({ timeout: 10000 });
  });

  test('change password successfully', async ({ page }) => {
    const user = await registerUser(page);
    await page.waitForURL('/', { timeout: 15000 });

    await page.goto('/profile');
    await page.getByLabel('Current Password').fill(user.password);
    await page.getByLabel('New Password', { exact: true }).fill('newpassword456');
    await page.getByLabel('Confirm New Password').fill('newpassword456');
    await page.getByRole('button', { name: /change password/i }).click();
    await expect(page.getByText(/password changed successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
