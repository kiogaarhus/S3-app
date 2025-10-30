/**
 * Authentication service for API calls.
 * Handles login, logout, and token management.
 */

const API_BASE_URL = 'http://localhost:8000';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface User {
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  disabled: boolean;
}

/**
 * Login user and get JWT token.
 */
export async function login(credentials: LoginCredentials): Promise<AuthToken> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

/**
 * Logout user (stateless - just clears local token).
 */
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Get current user information.
 */
export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

/**
 * Save token to localStorage.
 */
export function saveToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Get token from localStorage.
 */
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Remove token from localStorage.
 */
export function removeToken(): void {
  localStorage.removeItem('auth_token');
}
