/**
 * Utility functions for validation-related operations
 */

/**
 * Determines if a signature quality meets or exceeds the required level
 * @param actual The actual quality level (SES, AES, QES)
 * @param required The required quality level
 * @returns boolean indicating if the actual quality meets or exceeds the required level
 */
export function isHigherOrEqualQuality(actual: string, required: string): boolean {
  const levels: Record<string, number> = {
    'SES': 1,
    'AES': 2,
    'QES': 3
  };
  return (levels[actual as keyof typeof levels] || 0) >= (levels[required as keyof typeof levels] || 0);
}

/**
 * Checks if a document fails validation due to settings requirements
 * @param isValid Whether the document is valid according to cryptographic checks
 * @param validSignatures Number of valid signatures
 * @param totalSignatures Total number of signatures
 * @param quality Document signature quality
 * @param legislation Document legislation
 * @param longTermValidation Whether document has long-term validation
 * @param visualDifferences Whether document has visual differences
 * @param undefinedChanges Whether document has undefined changes
 * @param settings Validation settings object
 * @returns boolean indicating if the document fails due to settings
 */
export function isFailedDueToSettings(
  isValid: boolean,
  validSignatures: number,
  totalSignatures: number,
  quality?: string,
  legislation?: string,
  longTermValidation?: boolean,
  visualDifferences?: boolean,
  undefinedChanges?: boolean,
  settings?: {
    quality?: string;
    legislation?: string;
    longTermValidation?: boolean;
    rejectVisualDifferences?: boolean;
    rejectUndefinedChanges?: boolean;
  }
): boolean {
  // If document is valid or there are no settings, it can't fail due to settings
  if (isValid || !settings) return false;
  
  // If there are invalid signatures, it's not failing due to settings
  if (validSignatures < totalSignatures) return false;
  
  // Check if any settings requirements are not met
  return (
    (quality && settings.quality && !isHigherOrEqualQuality(quality, settings.quality)) || 
    (legislation && settings.legislation && legislation !== settings.legislation) || 
    (!!settings.longTermValidation && longTermValidation === false) || 
    (!!settings.rejectVisualDifferences && visualDifferences === true) || 
    (!!settings.rejectUndefinedChanges && undefinedChanges === true)
  );
}

/**
 * Generates a list of failure reasons based on validation results and settings
 * @param quality Document signature quality
 * @param legislation Document legislation
 * @param longTermValidation Whether document has long-term validation
 * @param visualDifferences Whether document has visual differences
 * @param undefinedChanges Whether document has undefined changes
 * @param settings Validation settings object
 * @param translations Translation function for failure messages
 * @returns Array of formatted failure reason strings
 */
export function getFailureReasons(
  quality?: string,
  legislation?: string,
  longTermValidation?: boolean,
  visualDifferences?: boolean,
  undefinedChanges?: boolean,
  settings?: {
    quality?: string;
    legislation?: string;
    longTermValidation?: boolean;
    rejectVisualDifferences?: boolean;
    rejectUndefinedChanges?: boolean;
  },
  translations?: Record<string, string>
): string[] {
  if (!settings) return [];
  
  const t = translations || {};
  const reasons = [];
  
  if (quality && settings.quality && !isHigherOrEqualQuality(quality, settings.quality)) {
    reasons.push(`${t.qualityRequirement || 'Required Quality'}: ${settings.quality}, ${t.actual || 'Actual'}: ${quality}`);
  }
  
  if (legislation && settings.legislation && legislation !== settings.legislation) {
    reasons.push(`${t.legislationRequirement || 'Required Legislation'}: ${settings.legislation}, ${t.actual || 'Actual'}: ${legislation}`);
  }
  
  if (settings.longTermValidation && !longTermValidation) {
    reasons.push(t.longTermValidationRequired || 'Long-term validation is required by settings');
  }
  
  if (settings.rejectVisualDifferences && visualDifferences) {
    reasons.push(t.visualDifferencesRejected || 'Visual differences are rejected by settings');
  }
  
  if (settings.rejectUndefinedChanges && undefinedChanges) {
    reasons.push(t.undefinedChangesRejected || 'Undefined changes are rejected by settings');
  }
  
  return reasons;
} 