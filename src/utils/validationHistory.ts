// ValidationHistory.ts - Utility for managing validation history in localStorage

export interface ValidationHistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  valid: boolean;
  totalSignatures: number;
  validSignatures: number;
  requirementsNotMet?: boolean;
}

class ValidationHistoryManager {
  private readonly STORAGE_KEY = 'Paperflow_validation_history';
  private readonly MAX_HISTORY_ITEMS = 20;
  
  // Get all validation history items
  getHistory(): ValidationHistoryItem[] {
    if (typeof window === 'undefined') return []; // Handle server-side rendering
    
    try {
      const historyJson = localStorage.getItem(this.STORAGE_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Failed to parse validation history from localStorage:', error);
      return [];
    }
  }
  
  // Add a new validation to history
  addToHistory(item: ValidationHistoryItem): void {
    if (typeof window === 'undefined') return; // Handle server-side rendering
    
    try {
      const history = this.getHistory();
      
      // Check if this validation ID already exists to avoid duplicates
      const exists = history.some(historyItem => historyItem.id === item.id);
      
      if (!exists) {
        // Add new item at the beginning (most recent first)
        const updatedHistory = [item, ...history];
        
        // Limit the number of items in history
        const limitedHistory = updatedHistory.slice(0, this.MAX_HISTORY_ITEMS);
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));
      }
    } catch (error) {
      console.error('Failed to save validation to history:', error);
    }
  }
  
  // Clear the validation history
  clearHistory(): void {
    if (typeof window === 'undefined') return; // Handle server-side rendering
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear validation history:', error);
    }
  }
  
  // Remove a specific validation from history by ID
  removeFromHistory(id: string): void {
    if (typeof window === 'undefined') return; // Handle server-side rendering
    
    try {
      const history = this.getHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to remove validation from history:', error);
    }
  }
  
  // Get a specific validation by ID
  getValidationById(id: string): ValidationHistoryItem | null {
    const history = this.getHistory();
    return history.find(item => item.id === id) || null;
  }
}

// Export a singleton instance
const validationHistory = new ValidationHistoryManager();
export default validationHistory; 