/**
 * SAURELLIUS DOCUMENT SERVICE
 * Frontend service for document upload, download, and management
 */

import api from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface Document {
  id: string;
  filename: string;
  category: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  metadata?: Record<string, any>;
}

export interface DocumentCategory {
  value: string;
  label: string;
}

export interface UploadResponse {
  success: boolean;
  document?: {
    id: string;
    filename: string;
    category: string;
    file_size: number;
    uploaded_at: string;
  };
  message?: string;
  error?: string;
}

export interface DocumentListResponse {
  success: boolean;
  documents: Document[];
  total: number;
  categories?: DocumentCategory[];
}

export interface SignedUrlResponse {
  success: boolean;
  url: string;
  expires_at: string;
  filename: string;
}

// ============================================================================
// DOCUMENT SERVICE
// ============================================================================

export const documentService = {
  /**
   * Upload a document file
   */
  uploadDocument: async (
    file: File,
    category: string,
    userType: 'employee' | 'contractor' | 'employer' = 'employee',
    metadata?: Record<string, string>
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('user_type', userType);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload document as base64
   */
  uploadBase64Document: async (
    filename: string,
    base64Data: string,
    category: string,
    userType: 'employee' | 'contractor' | 'employer' = 'employee',
    metadata?: Record<string, any>
  ): Promise<UploadResponse> => {
    const response = await api.post('/api/documents/upload', {
      filename,
      file_data: base64Data,
      category,
      user_type: userType,
      metadata,
    });
    return response.data;
  },

  /**
   * Upload employee document
   */
  uploadEmployeeDocument: async (
    file: File,
    category: string,
    description?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post('/api/documents/upload/employee', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload contractor document
   */
  uploadContractorDocument: async (
    file: File,
    category: string,
    metadata?: { expense_id?: string; invoice_id?: string; description?: string }
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
    }

    const response = await api.post('/api/documents/upload/contractor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload receipt for expense
   */
  uploadReceipt: async (
    file: File,
    expenseId: string,
    vendor?: string,
    amount?: string,
    date?: string,
    description?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expense_id', expenseId);
    if (vendor) formData.append('vendor', vendor);
    if (amount) formData.append('amount', amount);
    if (date) formData.append('date', date);
    if (description) formData.append('description', description);

    const response = await api.post('/api/documents/receipts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get user's documents
   */
  getDocuments: async (
    category?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<DocumentListResponse> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`/api/documents/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get document details
   */
  getDocument: async (documentId: string): Promise<{ success: boolean; document: Document }> => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },

  /**
   * Download document
   */
  downloadDocument: async (documentId: string): Promise<Blob> => {
    const response = await api.get(`/api/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get signed download URL
   */
  getSignedUrl: async (documentId: string, expiresIn: number = 3600): Promise<SignedUrlResponse> => {
    const response = await api.get(`/api/documents/${documentId}/url?expires_in=${expiresIn}`);
    return response.data;
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },

  /**
   * Get document categories for employees
   */
  getEmployeeCategories: async (): Promise<{ success: boolean; categories: DocumentCategory[] }> => {
    const response = await api.get('/api/documents/categories/employee');
    return response.data;
  },

  /**
   * Get document categories for contractors
   */
  getContractorCategories: async (): Promise<{ success: boolean; categories: DocumentCategory[] }> => {
    const response = await api.get('/api/documents/categories/contractor');
    return response.data;
  },

  /**
   * Get document categories for employers
   */
  getEmployerCategories: async (): Promise<{ success: boolean; categories: DocumentCategory[] }> => {
    const response = await api.get('/api/documents/categories/employer');
    return response.data;
  },

  /**
   * Bulk upload documents
   */
  bulkUpload: async (
    files: File[],
    category: string,
    userType: 'employee' | 'contractor' | 'employer' = 'employee'
  ): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      filename: string;
      success: boolean;
      document_id?: string;
      error?: string;
    }>;
  }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);
    formData.append('user_type', userType);

    const response = await api.post('/api/documents/bulk/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get receipts for contractor
   */
  getReceipts: async (): Promise<DocumentListResponse> => {
    const response = await api.get('/api/documents/receipts');
    return response.data;
  },
};

// ============================================================================
// EMPLOYEE PORTAL DOCUMENT SERVICE
// ============================================================================

export const employeeDocumentService = {
  /**
   * Get employee portal documents
   */
  getDocuments: async (category?: string): Promise<DocumentListResponse> => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/api/employee/portal/documents${params}`);
    return response.data;
  },

  /**
   * Upload document to employee portal
   */
  uploadDocument: async (
    file: File,
    category: string,
    description?: string,
    documentDate?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) formData.append('description', description);
    if (documentDate) formData.append('document_date', documentDate);

    const response = await api.post('/api/employee/portal/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get document details
   */
  getDocument: async (documentId: string): Promise<{ success: boolean; document: Document }> => {
    const response = await api.get(`/api/employee/portal/documents/${documentId}`);
    return response.data;
  },

  /**
   * Download document
   */
  downloadDocument: async (documentId: string): Promise<Blob> => {
    const response = await api.get(`/api/employee/portal/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/employee/portal/documents/${documentId}`);
    return response.data;
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (
  filename: string,
  allowedTypes: string[] = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg']
): boolean => {
  const ext = getFileExtension(filename);
  return allowedTypes.includes(ext);
};

/**
 * Trigger file download in browser
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default documentService;
