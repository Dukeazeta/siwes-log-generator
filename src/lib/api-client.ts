import { supabase } from './supabase';
import { authHelpers } from './auth-helpers';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      // First try to get session from Supabase client
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('API Client: Using token from Supabase session');
      } else {
        // Fallback to cookies
        const token = authHelpers.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('API Client: Using token from cookies');
        } else {
          console.warn('API Client: No auth token available');
        }
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error);
      // Try cookies as fallback
      const token = authHelpers.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('API Client: Using token from cookies (fallback)');
      }
    }

    return headers;
  }

  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();

    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies for authentication
      ...options,
    });
  }

  async post(endpoint: string, data?: Record<string, unknown>, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();

    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for authentication
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async put(endpoint: string, data?: Record<string, unknown>, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();

    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();

    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...options,
    });
  }

  // Helper method to handle JSON responses with better error handling
  async handleJsonResponse<T = Record<string, unknown>>(
    response: Response
  ): Promise<T> {
    if (!response.ok) {
      let errorMessage: string;
      let errorData: Record<string, unknown> | null = null;

      try {
        const responseText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        });

        // Try to parse as JSON
        try {
          errorData = JSON.parse(responseText);
          const errorObj = errorData as Record<string, unknown>;
          errorMessage = (errorObj.error as string) || (errorObj.details as string) || 'Request failed';
        } catch {
          // If not JSON, use the text response
          if (responseText.startsWith('<!DOCTYPE')) {
            errorMessage = 'Request was redirected to login page. Please refresh and try again.';
          } else {
            errorMessage = responseText || `Request failed with status ${response.status}`;
          }
        }
      } catch (parseError) {
        console.error('Failed to read error response:', parseError);
        errorMessage = `Request failed with status ${response.status}`;
      }

      // Handle specific error cases with more context
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds and try again.`);
        } else {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
      } else if (response.status === 500) {
        console.error('Server 500 error details:', { errorData, errorMessage });
        const errorObj = errorData as Record<string, unknown>;
        if (typeof errorObj?.details === 'string' && (errorObj.details as string).includes('rate limit') ||
            typeof errorObj?.error === 'string' && (errorObj.error as string).includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (typeof errorObj?.details === 'string' && (errorObj.details as string).includes('API key') ||
                   typeof errorObj?.error === 'string' && (errorObj.error as string).includes('API key')) {
          throw new Error('AI service configuration error. Please contact support.');
        } else {
          throw new Error(`Server error: ${errorMessage}. Please try again in a few moments.`);
        }
      } else if (response.status === 413) {
        throw new Error('Request too large. Please reduce the amount of text and try again.');
      } else if (response.status >= 400 && response.status < 500) {
        throw new Error(`Request error: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid response from server. Please try again.');
    }
  }

  // Convenience methods with retry logic for rate limiting
  async postJson<T = Record<string, unknown>>(
    endpoint: string,
    data?: Record<string, unknown>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const response = await this.post(endpoint, data);
        return await this.handleJsonResponse<T>(response);
      } catch (error) {
        attempt++;

        // Check if we should retry
        const shouldRetry =
          error instanceof Error &&
          (error.message.includes('Rate limit') ||
            error.message.includes('Too many requests') ||
            error.message.includes('Server error') && attempt < maxRetries);

        if (shouldRetry && attempt <= maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw new Error('Maximum retries exceeded');
  }

  async getJson<T = Record<string, unknown>>(endpoint: string): Promise<T> {
    const response = await this.get(endpoint);
    return this.handleJsonResponse<T>(response);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient('/api');

// Export a hook for React components
export function useApiClient() {
  return apiClient;
}