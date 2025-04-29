import type { SignatureRequestResponse } from '@/lib/SigningApiClient';

// Define types for better type safety
export interface StoredSignatureData {
  [id: string]: SignatureRequestResponse & { 
    timestamp?: string;
    validationId?: string;
    documentBase64?: string;
    [key: string]: unknown;
  };
}

/**
 * SigningStorage class to handle all signature request storage operations
 */
class SigningStorage {
  private readonly SIGNATURE_STORAGE_KEY = 'signatureData';
  private readonly ACTIVE_REQUEST_KEY = 'activeSignatureRequest';

  /**
   * Save signature request data
   */
  saveSignatureData = (id: string, data: SignatureRequestResponse & Record<string, unknown>): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get existing signature data
      const existingDataStr = localStorage.getItem(this.SIGNATURE_STORAGE_KEY) || '{}';
      const existingData = JSON.parse(existingDataStr) as StoredSignatureData;
      
      // Add new signature data
      existingData[id] = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem(this.SIGNATURE_STORAGE_KEY, JSON.stringify(existingData));
      console.log(`Saved signature data for ID: ${id}`);
    } catch (err) {
      console.error('Error saving signature data to localStorage:', err);
    }
  };
  
  /**
   * Get signature data by ID
   */
  getSignatureData = (id: string): (SignatureRequestResponse & Record<string, unknown>) | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const dataStr = localStorage.getItem(this.SIGNATURE_STORAGE_KEY) || '{}';
      const data = JSON.parse(dataStr) as StoredSignatureData;
      return data[id] || null;
    } catch (err) {
      console.error('Error getting signature data from localStorage:', err);
      return null;
    }
  };

  /**
   * Save document content (base64) associated with a signature request
   */
  saveDocumentContent = (signatureRequestId: string, documentBase64: string): void => {
    if (typeof window === 'undefined') return;

    try {
      // Save the document content in the signature data
      const signatureData = this.getSignatureData(signatureRequestId);
      if (signatureData) {
        this.saveSignatureData(signatureRequestId, {
          ...signatureData,
          documentBase64
        });
      }
      
      // Also save directly to localStorage for easier access
      localStorage.setItem(`document_${signatureRequestId}`, documentBase64);
      console.log(`Saved document content for signature request: ${signatureRequestId}`);
    } catch (err) {
      console.error('Error saving document content:', err);
    }
  };

  /**
   * Get document content directly from localStorage
   */
  getDocumentContent = (requestId: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    // Try first in the dedicated document storage
    const directContent = localStorage.getItem(`document_${requestId}`);
    if (directContent) {
      console.log(`Found document content directly for request ${requestId} (length: ${directContent.length})`);
      return directContent;
    }
    
    // If not found, check in the signature data
    try {
      const signatureData = this.getSignatureData(requestId);
      if (signatureData?.documentBase64) {
        console.log(`Found document content in signature data for request ${requestId}`);
        return signatureData.documentBase64 as string;
      }
    } catch (err) {
      console.error('Error retrieving document content from signature data:', err);
    }
    
    console.log(`No document content found for request ${requestId}`);
    return null;
  };

  /**
   * Link a signature request to a validation ID
   */
  linkToValidation = (signatureRequestId: string, validationId: string): void => {
    if (typeof window === 'undefined') return;

    try {
      const signatureData = this.getSignatureData(signatureRequestId);
      if (signatureData) {
        this.saveSignatureData(signatureRequestId, {
          ...signatureData,
          validationId
        });
        console.log(`Linked signature request ${signatureRequestId} to validation ${validationId}`);
      }
    } catch (err) {
      console.error('Error linking signature to validation:', err);
    }
  };

  /**
   * Set active signature request ID (for onboarding flow)
   */
  setActiveRequest = (id: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACTIVE_REQUEST_KEY, id);
  };

  /**
   * Get active signature request ID
   */
  getActiveRequest = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACTIVE_REQUEST_KEY);
  };

  /**
   * Clear all signature data
   */
  clearSignatureData = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.SIGNATURE_STORAGE_KEY);
    localStorage.removeItem(this.ACTIVE_REQUEST_KEY);
  };
}

// Export a singleton instance
const signingStorage = new SigningStorage();
export default signingStorage; 