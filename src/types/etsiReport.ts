/**
 * Types for ETSI TS 119 102-2 validation report data
 */

export interface ValidationConstraint {
  ValidationConstraintIdentifier: string;
  ConstraintStatus: {
    Status: string;
  };
  ValidationStatus?: {
    MainIndication: string;
    SubIndication?: string;
  };
}

export interface ValidationTimeInfo {
  ValidationTime: string;
  BestSignatureTime?: {
    POETime: string;
    TypeOfProof: string;
    POEObject: {
      VOReference: string;
    };
  };
}

export interface SignatureAttribute {
  name: string;
  value: string;
  signed: boolean;
}

export interface CertificateInfo {
  id: string;
  serialNumber: string;
  subject: string;
  issuer: string;
}

export interface CryptoInformation {
  Algorithm: string;
  SecureAlgorithm: boolean;
  NotAfter?: string;
}

export interface TechnicalValidationData {
  constraints: ValidationConstraint[];
  timeInfo: ValidationTimeInfo;
  signerInfo: {
    signer: string;
    certificate: CertificateInfo;
  };
  attributes: SignatureAttribute[];
  cryptoInfo: CryptoInformation[];
  processName: string;
  mainIndication: string;
  subIndication?: string;
}

export interface TrustChainNode {
  id: string;
  type: 'signer' | 'intermediate' | 'trustAnchor';
  name: string;
  isValid: boolean;
}

export interface TrustChain {
  nodes: TrustChainNode[];
  connections: [string, string][]; // [fromId, toId]
}

export interface ValidationScoreItem {
  name: string;
  score: number; // 0-100
  description: string;
}

export interface ValidationScore {
  overall: number; // 0-100
  items: ValidationScoreItem[];
} 