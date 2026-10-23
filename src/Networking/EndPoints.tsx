/**
 * API Configuration and Endpoints
 * Centralized endpoint management for all API calls
 */

// Base URLs
// export const API_BASE_URL = 'https://vaidhikadharma.in';
export const API_BASE_URL = 'http://localhost:3000';



// =======================
// AUTH ENDPOINTS
// =======================

export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/api/v1/auth/login`,
  checkEmail: (email: string) => `${API_BASE_URL}/api/enrollments/user/${email}`,
  register: `${API_BASE_URL}/api/v1/auth/register`,
  refreshToken: `${API_BASE_URL}/api/v1/auth/refresh`,
  recoveryCode: `${API_BASE_URL}/auth/recovery-code`,
  verifyRecoveryCode: `${API_BASE_URL}/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
};





export const API_ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
};

export default API_ENDPOINTS;
