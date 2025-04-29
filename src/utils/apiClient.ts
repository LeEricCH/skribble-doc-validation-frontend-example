/**
 * Utility for making API requests with Turnstile verification
 */

/**
 * Makes a fetch request with the Turnstile token included
 */
export async function fetchWithTurnstile(url: string, options: RequestInit = {}): Promise<Response> {
  // Get the stored Turnstile token
  const turnstileToken = typeof window !== 'undefined' ? localStorage.getItem('turnstileToken') : null;
  
  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Add the Turnstile token if available
  if (turnstileToken) {
    headers.set('x-turnstile-token', turnstileToken);
  }
  
  // Make the request with updated headers
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Gets the signature request status with Turnstile verification
 */
export async function getSignatureRequestStatus(requestId: string): Promise<unknown> {
  try {
    const response = await fetchWithTurnstile(`/api/signing/request-status/${requestId}`);
    
    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get signature request status');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching signature request status:', error);
    throw error;
  }
}

/**
 * Gets the document content with Turnstile verification
 */
export async function getDocumentContent(documentId: string, responseType: 'json' | 'blob' = 'json'): Promise<unknown> {
  try {
    const response = await fetchWithTurnstile(`/api/signing/document/${documentId}?responseType=${responseType}`);
    
    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get document content');
    }
    
    return responseType === 'blob' ? response.blob() : response.json();
  } catch (error) {
    console.error('Error fetching document content:', error);
    throw error;
  }
} 