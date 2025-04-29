import type { ValidationResponse, ValidationOptions } from '@/types/validation';

// Define types for better type safety
export interface StoredValidationData {
  [id: string]: ValidationResponse & { 
    filename?: string;
    size?: number;
    validationTimestamp?: string;
    settings?: ValidationOptions;
    [key: string]: unknown;
  };
}

export interface BatchValidationResult {
  batch: {
    id: string; // Unique ID for the batch
    timestamp: string; // When the batch validation was performed
    summary: {
      totalFiles: number;
      validFiles: number;
      invalidFiles: number;
      errorFiles: number;
    },
    settings?: ValidationOptions;
    validationIds: string[]; // Array of validation IDs in this batch
  },
  results: (ValidationResponse & { 
    originalFile?: string;
    error?: string | null; 
  })[];
}

// Store information about which batches exist
export interface BatchRegistry {
  batches: {
    id: string;
    timestamp: string;
    validationIds: string[];
  }[];
}

/**
 * ValidationStorage class to handle all validation storage operations
 */
class ValidationStorage {
  private readonly INDIVIDUAL_STORAGE_KEY = 'validationData';
  private readonly BATCH_STORAGE_KEY = 'batchValidationData';
  private readonly BATCH_REGISTRY_KEY = 'batchRegistry';

  /**
   * Save individual validation data
   */
  saveValidationData = (id: string, data: ValidationResponse & Record<string, unknown>, batchId?: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get existing validation data
      const existingDataStr = localStorage.getItem(this.INDIVIDUAL_STORAGE_KEY) || '{}';
      const existingData = JSON.parse(existingDataStr) as StoredValidationData;
      
      // Add new validation data with batch ID if applicable
      existingData[id] = {
        ...data,
        batchId // Add batchId to track that this validation is part of a batch
      };
      
      // Save back to localStorage
      localStorage.setItem(this.INDIVIDUAL_STORAGE_KEY, JSON.stringify(existingData));
      console.log(`Saved validation data for ID: ${id}${batchId ? ` (batch: ${batchId})` : ''}`);
    } catch (err) {
      console.error('Error saving validation data to localStorage:', err);
    }
  };
  
  /**
   * Save batch validation data
   */
  saveBatchValidationData = (batchData: BatchValidationResult): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Generate a batch ID if one doesn't exist
      if (!batchData.batch.id) {
        batchData.batch.id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Ensure timestamp exists
      if (!batchData.batch.timestamp) {
        batchData.batch.timestamp = new Date().toISOString();
      }
      
      // Extract validation IDs from results
      const validationIds = batchData.results
        .filter(result => result.id)
        .map(result => result.id as string);
      
      // Update batch with validationIds
      batchData.batch.validationIds = validationIds;
      
      // Save the batch data
      localStorage.setItem(this.BATCH_STORAGE_KEY, JSON.stringify(batchData));
      console.log('Saved batch validation data to localStorage', batchData.batch.id);
      
      // Update batch registry
      this.updateBatchRegistry(batchData.batch.id, batchData.batch.timestamp, validationIds);
      
      // Also save each individual validation with a reference to this batch
      batchData.results.forEach(result => {
        if (result.id) {
          this.saveValidationData(result.id, {
            ...result,
            batchId: batchData.batch.id,
            timestamp: batchData.batch.timestamp
          });
        }
      });
    } catch (err) {
      console.error('Error saving batch validation data to localStorage:', err);
    }
  };
  
  /**
   * Update the batch registry
   */
  private updateBatchRegistry = (batchId: string, timestamp: string, validationIds: string[]): void => {
    try {
      // Get existing registry
      const registryStr = localStorage.getItem(this.BATCH_REGISTRY_KEY) || '{"batches":[]}';
      const registry = JSON.parse(registryStr) as BatchRegistry;
      
      // Check if batch exists in registry
      const existingBatchIndex = registry.batches.findIndex(batch => batch.id === batchId);
      
      if (existingBatchIndex >= 0) {
        // Update existing batch
        registry.batches[existingBatchIndex] = {
          id: batchId,
          timestamp,
          validationIds
        };
      } else {
        // Add new batch
        registry.batches.push({
          id: batchId,
          timestamp,
          validationIds
        });
      }
      
      // Sort batches by timestamp (newest first)
      registry.batches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Save updated registry
      localStorage.setItem(this.BATCH_REGISTRY_KEY, JSON.stringify(registry));
    } catch (err) {
      console.error('Error updating batch registry:', err);
    }
  };
  
  /**
   * Get batch validation data
   */
  getBatchValidationData = (): BatchValidationResult | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const dataStr = localStorage.getItem(this.BATCH_STORAGE_KEY);
      if (!dataStr) return null;
      return JSON.parse(dataStr) as BatchValidationResult;
    } catch (err) {
      console.error('Error getting batch validation data from localStorage:', err);
      return null;
    }
  };
  
  /**
   * Get batch validation data by ID
   */
  getBatchById = (batchId: string): BatchValidationResult | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Check if current batch has this ID
      const currentBatch = this.getBatchValidationData();
      if (currentBatch && currentBatch.batch.id === batchId) {
        return currentBatch;
      }
      
      // In a more robust implementation, we would store batches in separate keys
      // or in an indexed DB for better performance with multiple batches
      return null;
    } catch (err) {
      console.error(`Error getting batch with ID ${batchId}:`, err);
      return null;
    }
  };
  
  /**
   * Get validation data by ID
   */
  getValidationData = (id: string): (ValidationResponse & Record<string, unknown>) | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const dataStr = localStorage.getItem(this.INDIVIDUAL_STORAGE_KEY) || '{}';
      const data = JSON.parse(dataStr) as StoredValidationData;
      return data[id] || null;
    } catch (err) {
      console.error('Error getting validation data from localStorage:', err);
      return null;
    }
  };
  
  /**
   * Check if a validation is part of a batch
   * @returns The batch ID if it's part of a batch, otherwise null
   */
  isPartOfBatch = (validationId: string): string | null => {
    try {
      const validation = this.getValidationData(validationId);
      return validation?.batchId as string || null;
    } catch (err) {
      console.error('Error checking if validation is part of batch:', err);
      return null;
    }
  };
  
  /**
   * Get all validation IDs in a batch
   */
  getValidationIdsInBatch = (batchId: string): string[] => {
    try {
      // First try to get from current batch
      const currentBatch = this.getBatchValidationData();
      if (currentBatch && currentBatch.batch.id === batchId) {
        return currentBatch.batch.validationIds || [];
      }
      
      // Try to get from registry
      const registryStr = localStorage.getItem(this.BATCH_REGISTRY_KEY) || '{"batches":[]}';
      const registry = JSON.parse(registryStr) as BatchRegistry;
      
      const batch = registry.batches.find(b => b.id === batchId);
      return batch?.validationIds || [];
    } catch (err) {
      console.error('Error getting validation IDs in batch:', err);
      return [];
    }
  };
  
  /**
   * Get batch information including summary
   */
  getBatchInfo = (batchId: string): {
    id: string;
    timestamp: string;
    summary: {
      totalFiles: number;
      validFiles: number;
      invalidFiles: number;
      errorFiles: number;
    };
    settings?: ValidationOptions;
  } | null => {
    try {
      const batch = this.getBatchById(batchId);
      if (batch) {
        return {
          id: batch.batch.id,
          timestamp: batch.batch.timestamp,
          summary: batch.batch.summary,
          settings: batch.batch.settings
        };
      }
      return null;
    } catch (err) {
      console.error('Error getting batch info:', err);
      return null;
    }
  };
  
  /**
   * Clear all validation data
   */
  clearValidationData = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.INDIVIDUAL_STORAGE_KEY);
    localStorage.removeItem(this.BATCH_STORAGE_KEY);
    localStorage.removeItem(this.BATCH_REGISTRY_KEY);
  };
}

// Export a singleton instance
const validationStorage = new ValidationStorage();
export default validationStorage; 