/**
 * Types for the Document Validation API
 */

// API Authentication
export interface LoginRequest {
  username: string;
  apikey: string;
}

export interface LoginResponse {
  accesstoken: string;
}

// Quality types
export type SignatureQuality = 'SES' | 'AES' | 'QES';

// Legislation types
export type Legislation = 'WORLD' | 'CH' | 'EU' | 'CH_EU';

// Additional Info types
export type AdditionalInfo = 'validation' | 'format' | 'signer';

// Validation Request Options
export interface ValidationOptions {
  quality?: SignatureQuality;
  longTermValidation?: boolean;
  legislation?: Legislation;
  infos?: AdditionalInfo[];
  rejectVisualDifferences?: boolean;
  rejectUndefinedChanges?: boolean;
}

// Validation Response
export interface ValidationResponse {
  id: string;
  valid: boolean;
  signatures: number;
  validSignatures: number;
  indication?: string;
  quality?: SignatureQuality;
  legislation?: Legislation;
  longTermValidation?: boolean;
  visualDifferences?: boolean;
  undefinedChanges?: boolean;
  timestamp?: string;
  filename?: string;
  // Additional fields that might be returned when requesting more info
  validationDetails?: Record<string, unknown>;
  formatDetails?: Record<string, unknown>;
  signerDetails?: Record<string, unknown>;
}

// Certificate information for a signer
export interface SignerCertificate {
  subject: string;
  issuer: string;
  serialNumber: string;
}

// Optional contact info for a signer
export interface SignerOptionalInfo {
  contact?: string;
  name?: string;
}

// Signer Information Response
export interface SignerInfo {
  valid: boolean;
  signer: string; // Full name of the signer
  time: string; // ISO timestamp of when the document was signed
  quality: SignatureQuality;
  legislation: Legislation;
  longTermValidation: boolean;
  visualDifferences: boolean;
  undefinedChanges: boolean;
  certificate: SignerCertificate;
  optionalInfos?: SignerOptionalInfo;
}

// API Error Response
export interface ApiErrorResponse {
  status: number;
  message: string;
  error?: Record<string, unknown>;
} 