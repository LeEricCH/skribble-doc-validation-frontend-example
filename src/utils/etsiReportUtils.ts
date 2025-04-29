import { DOMParser } from 'xmldom';
import type { 
  TechnicalValidationData, 
  ValidationConstraint, 
  ValidationTimeInfo,
  SignatureAttribute,
  CryptoInformation,
  TrustChain,
  ValidationScore,
  ValidationScoreItem
} from '@/types/etsiReport';

/**
 * Parses the ETSI validation report XML string into structured data
 */
export function parseEtsiReport(xmlString: string): TechnicalValidationData | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Extract validation constraints
    const constraintElements = xmlDoc.getElementsByTagName('ValidationConstraint');
    const constraints: ValidationConstraint[] = [];
    
    for (let i = 0; i < constraintElements.length; i++) {
      const element = constraintElements[i];
      const constraintIdElement = element.getElementsByTagName('ValidationConstraintIdentifier')[0];
      const statusElement = element.getElementsByTagName('Status')[0];
      
      if (constraintIdElement && statusElement) {
        const constraint: ValidationConstraint = {
          ValidationConstraintIdentifier: constraintIdElement.textContent || '',
          ConstraintStatus: {
            Status: statusElement.textContent || ''
          }
        };
        
        // Check if there's validation status
        const validationStatusElement = element.getElementsByTagName('ValidationStatus')[0];
        if (validationStatusElement) {
          const mainIndicationElement = validationStatusElement.getElementsByTagName('MainIndication')[0];
          const subIndicationElement = validationStatusElement.getElementsByTagName('SubIndication')[0];
          
          constraint.ValidationStatus = {
            MainIndication: mainIndicationElement?.textContent || ''
          };
          
          if (subIndicationElement) {
            constraint.ValidationStatus.SubIndication = subIndicationElement.textContent || '';
          }
        }
        
        constraints.push(constraint);
      }
    }
    
    // Extract validation time info
    const timeInfoElement = xmlDoc.getElementsByTagName('ValidationTimeInfo')[0];
    const timeInfo: ValidationTimeInfo = {
      ValidationTime: ''
    };
    
    if (timeInfoElement) {
      const validationTimeElement = timeInfoElement.getElementsByTagName('ValidationTime')[0];
      timeInfo.ValidationTime = validationTimeElement?.textContent || '';
      
      const bestSignatureTimeElement = timeInfoElement.getElementsByTagName('BestSignatureTime')[0];
      if (bestSignatureTimeElement) {
        const poeTimeElement = bestSignatureTimeElement.getElementsByTagName('POETime')[0];
        const typeOfProofElement = bestSignatureTimeElement.getElementsByTagName('TypeOfProof')[0];
        const poeObjectElement = bestSignatureTimeElement.getElementsByTagName('POEObject')[0];
        
        if (poeTimeElement && typeOfProofElement && poeObjectElement) {
          timeInfo.BestSignatureTime = {
            POETime: poeTimeElement.textContent || '',
            TypeOfProof: typeOfProofElement.textContent || '',
            POEObject: {
              VOReference: poeObjectElement.getAttribute('VOReference') || ''
            }
          };
        }
      }
    }
    
    // Extract signature attributes
    const sigAttributesElement = xmlDoc.getElementsByTagName('SignatureAttributes')[0];
    const attributes: SignatureAttribute[] = [];
    
    if (sigAttributesElement) {
      // Process each child element as an attribute
      for (let i = 0; i < sigAttributesElement.childNodes.length; i++) {
        const node = sigAttributesElement.childNodes[i];
        if (node.nodeType === 1) { // Element node
          const element = node as Element;
          const name = element.nodeName;
          const isSigned = element.getAttribute('Signed') === 'true';
          let value = '';
          
          // Try to get nested content
          if (element.getElementsByTagName('Time').length > 0) {
            value = element.getElementsByTagName('Time')[0].textContent || '';
          } else if (element.getElementsByTagName('Digest').length > 0) {
            value = element.getElementsByTagName('Digest')[0].textContent || '';
          } else if (element.getElementsByTagName('TimeStampValue').length > 0) {
            value = element.getElementsByTagName('TimeStampValue')[0].textContent || '';
          } else if (element.getElementsByTagName('NameElement').length > 0) {
            value = element.getElementsByTagName('NameElement')[0].textContent || '';
          } else if (element.getElementsByTagName('ContentType').length > 0) {
            value = element.getElementsByTagName('ContentType')[0].textContent || '';
          } else if (element.getElementsByTagName('ContactInfoElement').length > 0) {
            value = element.getElementsByTagName('ContactInfoElement')[0].textContent || '';
          } else if (element.getElementsByTagName('SubFilterElement').length > 0) {
            value = element.getElementsByTagName('SubFilterElement')[0].textContent || '';
          } else if (element.getElementsByTagName('Filter').length > 0) {
            value = element.getElementsByTagName('Filter')[0].textContent || '';
          }
          
          if (name && name !== '#text') {
            attributes.push({
              name,
              value,
              signed: isSigned
            });
          }
        }
      }
    }
    
    // Extract signer info
    const signerInfoElement = xmlDoc.getElementsByTagName('SignerInformation')[0];
    const signerElement = signerInfoElement?.getElementsByTagName('Signer')[0];
    const signerCertElement = signerInfoElement?.getElementsByTagName('SignerCertificate')[0];
    
    const signerInfo = {
      signer: signerElement?.textContent || 'Unknown Signer',
      certificate: {
        id: signerCertElement?.getAttribute('VOReference') || '',
        serialNumber: '', // Will be populated from certificate objects if available
        subject: '', // Will be populated from certificate objects if available
        issuer: '' // Will be populated from certificate objects if available
      }
    };
    
    // Extract crypto information
    const cryptoInfoElements = xmlDoc.getElementsByTagName('CryptoInformation');
    const cryptoInfo: CryptoInformation[] = [];
    
    for (let i = 0; i < cryptoInfoElements.length; i++) {
      const element = cryptoInfoElements[i];
      const algorithmElement = element.getElementsByTagName('Algorithm')[0];
      const secureElement = element.getElementsByTagName('SecureAlgorithm')[0];
      const notAfterElement = element.getElementsByTagName('NotAfter')[0];
      
      if (algorithmElement && secureElement) {
        const info: CryptoInformation = {
          Algorithm: algorithmElement.textContent || '',
          SecureAlgorithm: secureElement.textContent === 'true'
        };
        
        if (notAfterElement) {
          info.NotAfter = notAfterElement.textContent || '';
        }
        
        cryptoInfo.push(info);
      }
    }
    
    // Extract main validation result
    const statusElement = xmlDoc.getElementsByTagName('SignatureValidationStatus')[0];
    const mainIndicationElement = statusElement?.getElementsByTagName('MainIndication')[0];
    const subIndicationElement = statusElement?.getElementsByTagName('SubIndication')[0];
    
    // Extract validation process
    const processElement = xmlDoc.getElementsByTagName('SignatureValidationProcessID')[0];
    
    // Create the technical validation data object
    const technicalData: TechnicalValidationData = {
      constraints,
      timeInfo,
      signerInfo,
      attributes,
      cryptoInfo,
      processName: processElement?.textContent || 'Unknown',
      mainIndication: mainIndicationElement?.textContent || 'Unknown',
      subIndication: subIndicationElement?.textContent ?? undefined
    };
    
    return technicalData;
  } catch (error) {
    console.error('Error parsing ETSI report:', error);
    return null;
  }
}

/**
 * Extracts certificate chain information from the ETSI report
 */
export function extractTrustChain(xmlString: string): TrustChain | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const nodes: TrustChain['nodes'] = [];
    const connections: TrustChain['connections'] = [];
    
    // Get certificates
    const certChainElement = xmlDoc.getElementsByTagName('CertificateChain')[0];
    if (certChainElement) {
      const signingCertElement = certChainElement.getElementsByTagName('SigningCertificate')[0];
      const trustAnchorElement = certChainElement.getElementsByTagName('TrustAnchor')[0];
      const intermediateCertElements = certChainElement.getElementsByTagName('Certificate');
      
      if (signingCertElement) {
        const signingCertId = signingCertElement.getAttribute('VOReference') || '';
        nodes.push({
          id: signingCertId,
          type: 'signer',
          name: 'Signer Certificate',
          isValid: true
        });
        
        // Add connection to intermediate if exists
        if (intermediateCertElements.length > 0) {
          const intermediateId = intermediateCertElements[0].getAttribute('VOReference') || '';
          connections.push([signingCertId, intermediateId]);
        } else if (trustAnchorElement) {
          // Connect directly to trust anchor if no intermediates
          const trustAnchorId = trustAnchorElement.getAttribute('VOReference') || '';
          connections.push([signingCertId, trustAnchorId]);
        }
      }
      
      // Add intermediate certificates
      for (let i = 0; i < intermediateCertElements.length; i++) {
        const certElement = intermediateCertElements[i];
        const certId = certElement.getAttribute('VOReference') || '';
        
        nodes.push({
          id: certId,
          type: 'intermediate',
          name: `Intermediate Certificate ${i + 1}`,
          isValid: true
        });
        
        // Connect to next intermediate or trust anchor
        if (i < intermediateCertElements.length - 1) {
          const nextCertId = intermediateCertElements[i + 1].getAttribute('VOReference') || '';
          connections.push([certId, nextCertId]);
        } else if (trustAnchorElement) {
          // Connect last intermediate to trust anchor
          const trustAnchorId = trustAnchorElement.getAttribute('VOReference') || '';
          connections.push([certId, trustAnchorId]);
        }
      }
      
      // Add trust anchor
      if (trustAnchorElement) {
        const trustAnchorId = trustAnchorElement.getAttribute('VOReference') || '';
        nodes.push({
          id: trustAnchorId,
          type: 'trustAnchor',
          name: 'Trust Anchor',
          isValid: true
        });
      }
    }
    
    return { nodes, connections };
  } catch (error) {
    console.error('Error extracting trust chain:', error);
    return null;
  }
}

/**
 * Calculates a technical validation score based on the ETSI report data
 */
export function calculateValidationScore(data: TechnicalValidationData): ValidationScore {
  const scoreItems: ValidationScoreItem[] = [];
  let totalScore = 0;
  
  // Score for validation constraints
  const constraintsPassed = data.constraints.filter(c => 
    c.ValidationStatus?.MainIndication === 'urn:etsi:019102:mainindication:passed'
  ).length;
  const constraintsTotal = data.constraints.filter(c => 
    c.ConstraintStatus.Status === 'urn:etsi:019102:constraintStatus:applied'
  ).length;
  
  if (constraintsTotal > 0) {
    const constraintScore = Math.round((constraintsPassed / constraintsTotal) * 100);
    scoreItems.push({
      name: 'Validation Constraints',
      score: constraintScore,
      description: `${constraintsPassed} of ${constraintsTotal} validation constraints passed`
    });
    totalScore += constraintScore;
  }
  
  // Score for cryptographic security
  const secureCryptoCount = data.cryptoInfo.filter(c => c.SecureAlgorithm).length;
  const totalCryptoCount = data.cryptoInfo.length;
  
  if (totalCryptoCount > 0) {
    const cryptoScore = Math.round((secureCryptoCount / totalCryptoCount) * 100);
    scoreItems.push({
      name: 'Cryptographic Security',
      score: cryptoScore,
      description: `${secureCryptoCount} of ${totalCryptoCount} cryptographic algorithms are secure`
    });
    totalScore += cryptoScore;
  }
  
  // Score for signature attributes
  const signedAttrsCount = data.attributes.filter(a => a.signed).length;
  const totalAttrsCount = data.attributes.length;
  
  if (totalAttrsCount > 0) {
    const attrsScore = Math.round((signedAttrsCount / totalAttrsCount) * 100);
    scoreItems.push({
      name: 'Signature Attributes',
      score: attrsScore,
      description: `${signedAttrsCount} of ${totalAttrsCount} attributes are signed`
    });
    totalScore += attrsScore;
  }
  
  // Process score
  let processScore = 0;
  if (data.processName.includes('LTA')) {
    processScore = 100; // Long-Term Archival format - highest score
    scoreItems.push({
      name: 'Signature Format',
      score: processScore,
      description: 'Long-Term Archival signature format (maximum longevity)'
    });
  } else if (data.processName.includes('LT')) {
    processScore = 80; // Long-Term format - good score
    scoreItems.push({
      name: 'Signature Format',
      score: processScore,
      description: 'Long-Term signature format (good longevity)'
    });
  } else if (data.processName.includes('T')) {
    processScore = 60; // Timestamped format - medium score
    scoreItems.push({
      name: 'Signature Format',
      score: processScore,
      description: 'Timestamped signature format (medium longevity)'
    });
  } else {
    processScore = 40; // Basic format - lower score
    scoreItems.push({
      name: 'Signature Format',
      score: processScore,
      description: 'Basic signature format (limited longevity)'
    });
  }
  totalScore += processScore;
  
  // Calculate overall score
  const divisor = scoreItems.length;
  const overall = divisor > 0 ? Math.round(totalScore / divisor) : 0;
  
  return {
    overall,
    items: scoreItems
  };
} 