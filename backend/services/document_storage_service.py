"""
SAURELLIUS DOCUMENT STORAGE SERVICE
Handles secure document upload, storage, and retrieval
Supports employee documents, contractor documents, tax forms, and business documents
"""

import os
import uuid
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from werkzeug.utils import secure_filename

# Allowed file types by category
ALLOWED_EXTENSIONS = {
    'documents': {'pdf', 'doc', 'docx', 'txt', 'rtf'},
    'images': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'},
    'spreadsheets': {'xls', 'xlsx', 'csv'},
    'tax_forms': {'pdf'},
    'receipts': {'pdf', 'png', 'jpg', 'jpeg'}
}

# Maximum file sizes (in bytes)
MAX_FILE_SIZES = {
    'default': 10 * 1024 * 1024,  # 10MB
    'tax_forms': 5 * 1024 * 1024,  # 5MB
    'receipts': 5 * 1024 * 1024,   # 5MB
    'images': 5 * 1024 * 1024      # 5MB
}

# Document categories
DOCUMENT_CATEGORIES = {
    'employee': [
        'paystubs', 'tax_documents', 'w2_forms', 'w4_forms', 
        'i9_documents', 'direct_deposit', 'benefits', 
        'policies', 'certifications', 'personal'
    ],
    'contractor': [
        'w9_forms', '1099_forms', 'invoices', 'receipts',
        'contracts', 'licenses', 'insurance', 'tax_documents'
    ],
    'employer': [
        'company_documents', 'tax_filings', 'payroll_reports',
        'compliance', 'employee_files', 'contractor_files'
    ]
}


class DocumentStorageService:
    """Handles secure document storage and retrieval."""
    
    def __init__(self):
        # In production: Use cloud storage (S3, GCS, Azure Blob)
        self.storage_path = os.getenv('DOCUMENT_STORAGE_PATH', '/tmp/saurellius_documents')
        self.documents: Dict[str, Dict] = {}  # document_id -> document metadata
        self.user_documents: Dict[str, List[str]] = {}  # user_id -> list of document_ids
        
        # Ensure storage directory exists
        os.makedirs(self.storage_path, exist_ok=True)
    
    def _allowed_file(self, filename: str, category: str = 'documents') -> bool:
        """Check if file extension is allowed."""
        if '.' not in filename:
            return False
        ext = filename.rsplit('.', 1)[1].lower()
        allowed = ALLOWED_EXTENSIONS.get(category, ALLOWED_EXTENSIONS['documents'])
        return ext in allowed
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension."""
        if '.' in filename:
            return filename.rsplit('.', 1)[1].lower()
        return ''
    
    def _generate_storage_key(self, user_id: str, category: str, filename: str) -> str:
        """Generate unique storage key for document."""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = secure_filename(filename)
        return f"{user_id}/{category}/{timestamp}_{unique_id}_{safe_filename}"
    
    def _calculate_checksum(self, data: bytes) -> str:
        """Calculate SHA-256 checksum of file data."""
        return hashlib.sha256(data).hexdigest()
    
    def upload_document(
        self,
        user_id: str,
        user_type: str,  # 'employee', 'contractor', 'employer'
        category: str,
        filename: str,
        file_data: bytes,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Upload a document securely.
        
        Args:
            user_id: ID of the user uploading
            user_type: Type of user (employee, contractor, employer)
            category: Document category
            filename: Original filename
            file_data: Binary file data
            metadata: Optional additional metadata
        
        Returns:
            Dict with success status and document info
        """
        # Validate category
        valid_categories = DOCUMENT_CATEGORIES.get(user_type, [])
        if category not in valid_categories:
            return {
                'success': False,
                'error': f'Invalid category. Must be one of: {", ".join(valid_categories)}'
            }
        
        # Validate file type
        file_category = 'tax_forms' if 'form' in category or 'tax' in category else 'documents'
        if category == 'receipts':
            file_category = 'receipts'
        
        if not self._allowed_file(filename, file_category):
            allowed = ALLOWED_EXTENSIONS.get(file_category, ALLOWED_EXTENSIONS['documents'])
            return {
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join(allowed)}'
            }
        
        # Validate file size
        max_size = MAX_FILE_SIZES.get(file_category, MAX_FILE_SIZES['default'])
        if len(file_data) > max_size:
            return {
                'success': False,
                'error': f'File too large. Maximum size: {max_size // (1024*1024)}MB'
            }
        
        # Generate document ID and storage key
        document_id = str(uuid.uuid4())
        storage_key = self._generate_storage_key(user_id, category, filename)
        
        # Calculate checksum
        checksum = self._calculate_checksum(file_data)
        
        # Store file (in production: upload to cloud storage)
        file_path = os.path.join(self.storage_path, storage_key)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        try:
            with open(file_path, 'wb') as f:
                f.write(file_data)
        except Exception as e:
            return {'success': False, 'error': f'Failed to save file: {str(e)}'}
        
        # Create document record
        document = {
            'id': document_id,
            'user_id': user_id,
            'user_type': user_type,
            'category': category,
            'filename': filename,
            'storage_key': storage_key,
            'file_size': len(file_data),
            'file_type': self._get_file_extension(filename),
            'checksum': checksum,
            'uploaded_at': datetime.utcnow().isoformat(),
            'metadata': metadata or {},
            'status': 'active'
        }
        
        # Save to storage
        self.documents[document_id] = document
        
        # Track by user
        if user_id not in self.user_documents:
            self.user_documents[user_id] = []
        self.user_documents[user_id].append(document_id)
        
        return {
            'success': True,
            'document': {
                'id': document_id,
                'filename': filename,
                'category': category,
                'file_size': len(file_data),
                'uploaded_at': document['uploaded_at']
            },
            'message': 'Document uploaded successfully'
        }
    
    def upload_base64_document(
        self,
        user_id: str,
        user_type: str,
        category: str,
        filename: str,
        base64_data: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Upload document from base64 encoded data."""
        try:
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            file_data = base64.b64decode(base64_data)
            return self.upload_document(user_id, user_type, category, filename, file_data, metadata)
        except Exception as e:
            return {'success': False, 'error': f'Invalid base64 data: {str(e)}'}
    
    def get_document(self, document_id: str, user_id: str) -> Dict:
        """Get document metadata."""
        document = self.documents.get(document_id)
        
        if not document:
            return {'error': 'Document not found'}
        
        # Verify ownership
        if document['user_id'] != user_id:
            return {'error': 'Access denied'}
        
        return {
            'id': document['id'],
            'filename': document['filename'],
            'category': document['category'],
            'file_size': document['file_size'],
            'file_type': document['file_type'],
            'uploaded_at': document['uploaded_at'],
            'metadata': document['metadata']
        }
    
    def download_document(self, document_id: str, user_id: str) -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
        """
        Download document file.
        
        Returns:
            Tuple of (file_data, filename, content_type) or (None, None, error_message)
        """
        document = self.documents.get(document_id)
        
        if not document:
            return None, None, 'Document not found'
        
        # Verify ownership
        if document['user_id'] != user_id:
            return None, None, 'Access denied'
        
        # Read file
        file_path = os.path.join(self.storage_path, document['storage_key'])
        
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
        except FileNotFoundError:
            return None, None, 'File not found in storage'
        except Exception as e:
            return None, None, f'Error reading file: {str(e)}'
        
        # Verify checksum
        if self._calculate_checksum(file_data) != document['checksum']:
            return None, None, 'File integrity check failed'
        
        # Determine content type
        content_types = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv': 'text/csv',
            'txt': 'text/plain',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif'
        }
        content_type = content_types.get(document['file_type'], 'application/octet-stream')
        
        return file_data, document['filename'], content_type
    
    def get_user_documents(
        self,
        user_id: str,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict:
        """Get all documents for a user."""
        document_ids = self.user_documents.get(user_id, [])
        
        documents = []
        for doc_id in document_ids:
            doc = self.documents.get(doc_id)
            if doc and doc['status'] == 'active':
                if category and doc['category'] != category:
                    continue
                documents.append({
                    'id': doc['id'],
                    'filename': doc['filename'],
                    'category': doc['category'],
                    'file_size': doc['file_size'],
                    'file_type': doc['file_type'],
                    'uploaded_at': doc['uploaded_at']
                })
        
        # Sort by upload date (newest first)
        documents.sort(key=lambda x: x['uploaded_at'], reverse=True)
        
        return {
            'documents': documents[offset:offset + limit],
            'total': len(documents),
            'limit': limit,
            'offset': offset
        }
    
    def delete_document(self, document_id: str, user_id: str) -> Dict:
        """Soft delete a document."""
        document = self.documents.get(document_id)
        
        if not document:
            return {'success': False, 'error': 'Document not found'}
        
        # Verify ownership
        if document['user_id'] != user_id:
            return {'success': False, 'error': 'Access denied'}
        
        # Soft delete
        document['status'] = 'deleted'
        document['deleted_at'] = datetime.utcnow().isoformat()
        
        return {'success': True, 'message': 'Document deleted'}
    
    def get_document_categories(self, user_type: str) -> List[Dict]:
        """Get available document categories for user type."""
        categories = DOCUMENT_CATEGORIES.get(user_type, [])
        
        category_labels = {
            'paystubs': 'Paystubs',
            'tax_documents': 'Tax Documents',
            'w2_forms': 'W-2 Forms',
            'w4_forms': 'W-4 Forms',
            'i9_documents': 'I-9 Documents',
            'direct_deposit': 'Direct Deposit',
            'benefits': 'Benefits Documents',
            'policies': 'Company Policies',
            'certifications': 'Certifications',
            'personal': 'Personal Documents',
            'w9_forms': 'W-9 Forms',
            '1099_forms': '1099 Forms',
            'invoices': 'Invoices',
            'receipts': 'Receipts',
            'contracts': 'Contracts',
            'licenses': 'Business Licenses',
            'insurance': 'Insurance Documents',
            'company_documents': 'Company Documents',
            'tax_filings': 'Tax Filings',
            'payroll_reports': 'Payroll Reports',
            'compliance': 'Compliance Documents',
            'employee_files': 'Employee Files',
            'contractor_files': 'Contractor Files'
        }
        
        return [
            {'value': cat, 'label': category_labels.get(cat, cat.replace('_', ' ').title())}
            for cat in categories
        ]
    
    def generate_signed_url(self, document_id: str, user_id: str, expires_in: int = 3600) -> Dict:
        """
        Generate a signed URL for document download.
        In production: Use cloud storage signed URLs.
        """
        document = self.documents.get(document_id)
        
        if not document:
            return {'success': False, 'error': 'Document not found'}
        
        if document['user_id'] != user_id:
            return {'success': False, 'error': 'Access denied'}
        
        # Generate signed token
        expiry = datetime.utcnow() + timedelta(seconds=expires_in)
        token = hashlib.sha256(
            f"{document_id}{user_id}{expiry.isoformat()}{os.getenv('SECRET_KEY', 'dev')}".encode()
        ).hexdigest()[:32]
        
        return {
            'success': True,
            'url': f"/api/documents/download/{document_id}?token={token}",
            'expires_at': expiry.isoformat(),
            'filename': document['filename']
        }


# Singleton instance
document_storage = DocumentStorageService()
