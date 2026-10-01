export class ApiError extends Error {
  status?: number;
  details?: any;
  isAuthExpired?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;

  constructor(message: string, options?: {
    status?: number;
    details?: any;
    isAuthExpired?: boolean;
    isTimeout?: boolean;
    isNetworkError?: boolean;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.details = options?.details;
    this.isAuthExpired = options?.isAuthExpired;
    this.isTimeout = options?.isTimeout;
    this.isNetworkError = options?.isNetworkError;
  }
}

export function isTokenExpired(token: string | null, bufferSeconds = 30): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now() + bufferSeconds * 1000;
  } catch {
    return true;
  }
}
