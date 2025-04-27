import type { SignerInfo } from './validation';

/**
 * Settings for validation requirements
 */
export interface ValidationSettings {
  quality?: string;
  legislation?: string;
  longTermValidation?: boolean;
  rejectVisualDifferences?: boolean;
  rejectUndefinedChanges?: boolean;
}

/**
 * Validation details included in a certificate
 */
export interface CertificateValidation {
  id: string;
  valid: boolean;
  requirementsNotMet?: boolean;
  signatures: number;
  validSignatures: number;
  quality?: string;
  legislation?: string;
  longTermValidation?: boolean;
  visualDifferences?: boolean;
  undefinedChanges?: boolean;
  timestamp: string;
  filename: string;
  settings?: ValidationSettings;
  details?: string[];
  indication?: string;
  subIndication?: string;
}

/**
 * Complete certificate data structure
 */
export interface CertificateData {
  id: string;
  timestamp: string;
  validation: CertificateValidation;
  signers: SignerInfo[];
}

/**
 * ValidationResponse with settings
 */
export interface ValidationResponseWithSettings {
  id?: string;
  indication?: string;
  valid?: boolean;
  signatures?: number;
  validSignatures?: number;
  quality?: string;
  legislation?: string;
  longTermValidation?: boolean;
  visualDifferences?: boolean;
  undefinedChanges?: boolean;
  timestamp?: string;
  filename?: string;
  settings?: ValidationSettings;
} 