import type { ValidationResponse, ValidationOptions } from '@/types/validation';

// Define types for better type safety
export interface StoredValidationData {
  [id: string]: ValidationResponse & {
    xmlReport: string;
    filename?: string;
    size?: number;
    validationTimestamp?: string;
    settings?: ValidationOptions;
    batchId?: string;
    [key: string]: unknown;
  };
}

export interface BatchValidationResult {
  batch: {
    id: string;
    timestamp: string;
    summary: {
      totalFiles: number;
      validFiles: number;
      invalidFiles: number;
      errorFiles: number;
    },
    settings?: ValidationOptions;
    validationIds: string[];
  },
  results: (ValidationResponse & { 
    originalFile?: string;
    error?: string | null; 
  })[];
}

// Unified storage structure
interface UnifiedValidationStorage {
  batches: {
    [batchId: string]: BatchValidationResult;
  };
  history: {
    id: string;
    timestamp: string;
    batchId: string;
  }[];
}

/**
 * ValidationStorage class to handle all validation storage operations
 */
class ValidationStorage {
  private readonly STORAGE_KEY = 'validation_storage';
  private readonly MAX_HISTORY_ITEMS = 20;

  /**
   * Get the unified storage data
   */
  private getStorage(): UnifiedValidationStorage {
    if (typeof window === 'undefined') {
      return { batches: {}, history: [] };
    }
    
    try {
      const dataStr = localStorage.getItem(this.STORAGE_KEY);
      if (!dataStr) {
        return { batches: {}, history: [] };
      }
      const parsed = JSON.parse(dataStr);
      return {
        batches: parsed.batches || {},
        history: parsed.history || []
      };
    } catch (err) {
      console.error('Error reading from unified storage:', err);
      return { batches: {}, history: [] };
    }
  }

  /**
   * Save the unified storage data
   */
  private saveStorage(data: UnifiedValidationStorage): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to unified storage:', err);
    }
  }

  /**
   * Save batch validation data
   */
  saveBatchValidationData = (batchData: BatchValidationResult): void => {
    const storage = this.getStorage();
    
    // Generate batch ID if needed
    if (!batchData.batch.id) {
      batchData.batch.id = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Ensure timestamp exists
    if (!batchData.batch.timestamp) {
      batchData.batch.timestamp = new Date().toISOString();
    }
    
    // Save batch data
    storage.batches[batchData.batch.id] = batchData;
    
    // Add to history
    const historyEntry = {
      id: batchData.batch.id,
      timestamp: batchData.batch.timestamp,
      batchId: batchData.batch.id
    };
    
    // Remove existing entry if it exists
    storage.history = storage.history.filter(item => item.id !== batchData.batch.id);
    
    // Add to beginning of history
    storage.history.unshift(historyEntry);
    
    // Limit history size
    storage.history = storage.history.slice(0, this.MAX_HISTORY_ITEMS);
    
    this.saveStorage(storage);
  };
  
  /**
   * Get validation data by ID
   */
  getValidationData = (id: string): (ValidationResponse & Record<string, unknown>) | null => {
    const storage = this.getStorage();
    // Find the batch containing this validation ID
    for (const batch of Object.values(storage.batches)) {
      const result = batch.results.find(r => r.id === id);
      if (result) {
        // Add batch settings to the result
        const resultWithSettings = {
          ...result,
          settings: batch.batch.settings
        };
        // Cast to the expected type
        return resultWithSettings as ValidationResponse & Record<string, unknown>;
      }
    }
    return null;
  };
  
  /**
   * Get batch validation data
   */
  getBatchValidationData = (): BatchValidationResult | null => {
    const storage = this.getStorage();
    // Return the most recent batch
    const batchIds = Object.keys(storage.batches);
    if (batchIds.length === 0) return null;
    
    // Sort by timestamp and get the most recent
    const mostRecentBatchId = batchIds.sort((a, b) => {
      const timeA = new Date(storage.batches[a].batch.timestamp).getTime();
      const timeB = new Date(storage.batches[b].batch.timestamp).getTime();
      return timeB - timeA;
    })[0];
    
    return storage.batches[mostRecentBatchId];
  };
  
  /**
   * Get batch by ID
   */
  getBatchById = (batchId: string): BatchValidationResult | null => {
    const storage = this.getStorage();
    return storage.batches[batchId] || null;
  };
  
  /**
   * Get validation history
   */
  getHistory = (): BatchValidationResult[] => {
    const storage = this.getStorage();
    return storage.history
      .map(item => storage.batches[item.batchId])
      .filter(Boolean) as BatchValidationResult[];
  };
  
  /**
   * Clear all validation data
   */
  clearValidationData = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  };
}

// Export a singleton instance
const validationStorage = new ValidationStorage();
export default validationStorage; 