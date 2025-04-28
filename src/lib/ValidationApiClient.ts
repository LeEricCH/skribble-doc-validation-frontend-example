import type { ValidationOptions, ValidationResponse, LoginRequest, LoginResponse, ApiErrorResponse, SignerInfo } from '../types/validation';

// Define a type that works across both Node.js and browser environments
export interface FileWithMetadata {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  text?(): Promise<string>;
}

/**
 * API Client for interacting with the Skribble Document Validation API.
 */
export class ValidationApiClient {
  private baseUrl: string;
  private username: string;
  private apikey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(username: string, apikey: string, baseUrl = 'https://document-validation.skribble.cloud/v1') {
    if (!username || !apikey) {
      throw new Error('Username and API key are required for ValidationApiClient.');
    }
    this.username = username;
    this.apikey = apikey;
    this.baseUrl = baseUrl;
  }

  /**
   * Handles common fetch logic and error handling.
   */
  private async fetchApi<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // Set a timeout - abort after 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const enhancedOptions = {
        ...options,
        signal: controller.signal,
      };
      
      // Attempt the fetch with a retry mechanism
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`API request to ${url} - attempt ${attempts}/${maxAttempts}`);
          
          const response = await fetch(url, enhancedOptions);
          clearTimeout(timeoutId); // Clear the timeout since we got a response
          
          if (!response.ok) {
            let errorDetail: Record<string, unknown> | string | undefined;
            // Check content type before attempting to parse
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
              try {
                errorDetail = await response.json();
              } catch (jsonError) {
                errorDetail = `Failed to parse JSON error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`;
              }
            } else {
              // Not JSON, try to read as text
              try {
                const text = await response.text();
                // If it looks like HTML, provide a more helpful error
                if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                  errorDetail = 'Received HTML instead of JSON. This may indicate the API URL is incorrect or the API server is down.';
                  console.error(`HTML Response received instead of JSON: ${text.substring(0, 200)}...`);
                } else {
                  errorDetail = text;
                }
              } catch (textError) {
                errorDetail = `Failed to read error response: ${textError instanceof Error ? textError.message : String(textError)}`;
              }
            }
            
            const apiError: ApiErrorResponse = {
              status: response.status,
              message: response.statusText,
              error: typeof errorDetail === 'string' ? { detail: errorDetail } : errorDetail, // Ensure error is Record or undefined
            };
            console.error('API Error:', JSON.stringify(apiError, null, 2));
            throw apiError;
          }

          // Check if JSON is expected in the response
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            console.warn(`Expected JSON response but got ${contentType}. URL: ${url}`);
            const text = await response.text();
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
              throw {
                status: 500,
                message: 'Invalid response format',
                error: { detail: 'Received HTML instead of JSON. Check the API URL and connectivity.' }
              } as ApiErrorResponse;
            }
            // Try to parse as JSON anyway as a fallback
            try {
              return JSON.parse(text) as T;
            } catch (error) {
              throw {
                status: 500,
                message: `Invalid response format: ${error}`,
                error: { detail: `Expected JSON but received: ${text.substring(0, 100)}...` }
              } as ApiErrorResponse;
            }
          }

          // Handle empty response body for status codes like 204
          if (response.status === 204) {
            return {} as T;
          }
          
          return await response.json() as T;
        } catch (fetchError) {
          // If this is the last attempt, throw the error
          if (attempts >= maxAttempts) {
            throw fetchError;
          }
          
          // Otherwise log and retry
          console.warn(`Fetch attempt ${attempts} failed, retrying...`, fetchError);
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
      
      // This should never be reached due to the throw in the last attempt
      throw new Error('Maximum retry attempts reached');
      
    } catch (error) {
      clearTimeout(timeoutId); // Ensure we clear the timeout
      
      // Check if it's an abort error
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.error('Request timed out');
        throw {
          status: 408, // Request Timeout
          message: 'Request timed out',
          error: { detail: 'The request to the validation API timed out after 30 seconds' }
        } as ApiErrorResponse;
      }
      
      // Check if it's already an ApiErrorResponse (thrown from above)
      if (error && typeof error === 'object' && 'status' in error) {
        throw error; // Re-throw the structured API error
      }
      
      // If it's a generic Error (like network error), wrap it
      if (error instanceof Error) {
        console.error('Fetch/Network Error:', error.message);
        throw {
          status: 500, 
          message: 'Network or fetch error', 
          error: { detail: error.message }
        } as ApiErrorResponse;
      }
      
      // Throw unexpected errors as is
      console.error('Unexpected error during fetch:', error);
      throw error;
    }
  }

  /**
   * Logs in to the API and retrieves an access token.
   * Handles token caching and automatic refresh if needed.
   */
  private async login(): Promise<string> {
    // Check if token exists and is not expired (with a 1-minute buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    console.log('Logging in to validation API...');
    const loginData: LoginRequest = {
      username: this.username,
      apikey: this.apikey,
    };

    try {
      const response = await this.fetchApi<LoginResponse>('/access/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.accesstoken) {
        throw new Error('Login response did not contain an access token.');
      }
      
      this.accessToken = response.accesstoken;
      // Decode token to get expiry time (assuming JWT format)
      try {
        // Ensure accessToken is not null before splitting
        if (!this.accessToken) {
          // This case should theoretically not happen after the check above, but belts and braces
          throw new Error('Access token is null after successful login response.');
        }
        const payload = JSON.parse(Buffer.from(this.accessToken.split('.')[1], 'base64').toString());
        this.tokenExpiry = payload.exp * 1000; // Convert seconds to milliseconds
      } catch (parseError) {
        console.error('Failed to parse token expiry, setting default expiry (1 hour):', parseError);
        // Set a default expiry if token parsing fails (e.g., 1 hour)
        this.tokenExpiry = Date.now() + 3600 * 1000;
      }
      console.log('Login successful, token obtained.');
      // Now we are sure accessToken is a string due to the check above
      return this.accessToken; 
    } catch (error) {
      console.error('API Login failed:', error);
      this.accessToken = null;
      this.tokenExpiry = null;
      // Re-throw the specific error from fetchApi or the token check error
      throw error; 
    }
  }

  /**
   * Validates a document by uploading it to the API.
   */
  public async validateDocument(file: FileWithMetadata, options?: ValidationOptions): Promise<ValidationResponse> {
    const token = await this.login(); // Ensure we have a valid token

    const formData = new FormData();
    formData.append('content', file as unknown as Blob, file.name);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            for (const item of value) {
              queryParams.append(key, item);
            }
          } else {
            queryParams.append(key, String(value));
          }
        }
      }
    }

    const queryString = queryParams.toString();
    const endpoint = `/validate/document${queryString ? `?${queryString}` : ''}`;
    
    console.log(`Validating document: ${file.name}`);
    return this.fetchApi<ValidationResponse>(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Content-Type is set automatically by fetch for FormData
      },
      body: formData,
    });
  }

  /**
   * Gets information about signers for a validated document.
   */
  public async getSignerInfo(validationId: string): Promise<SignerInfo[]> {
    const token = await this.login(); // Ensure we have a valid token
    
    console.log(`Fetching signer information for validation ID: ${validationId}`);
    return this.fetchApi<SignerInfo[]>(`/infos/${validationId}/signers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gets validation data for a validated document by ID.
   */
  public async getValidationData(validationId: string): Promise<ValidationResponse> {
    const token = await this.login(); // Ensure we have a valid token
    
    console.log(`Fetching validation data for ID: ${validationId}`);
    return this.fetchApi<ValidationResponse>(`/infos/${validationId}/validation`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
} 