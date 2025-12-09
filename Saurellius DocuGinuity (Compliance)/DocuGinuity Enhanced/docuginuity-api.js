/**
 * DocuGinuity Document Fetching API
 * 
 * A sophisticated document compliance and management system that provides:
 * 1. Automated document fetching from multiple government sources
 * 2. Real-time compliance monitoring with intelligent updates
 * 3. Multi-jurisdiction support across states and territories
 * 4. Smart document classification and processing
 * 5. Seamless integration with HR and payroll systems
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('./middleware/auth');
const documentFetchService = require('./services/documentFetchService');
const documentMonitorService = require('./services/documentMonitorService');
const jurisdictionService = require('./services/jurisdictionService');
const resourceManagerService = require('./services/resourceManagerService');
const integrationService = require('./services/integrationService');
const { DocumentFetchError, JurisdictionError } = require('./utils/errors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Apply security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Authenticate all API requests
app.use('/api/', authenticate);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DocuGinuity Document Fetching API',
    version: '1.0.0',
    documentation: '/docs',
    status: 'operational'
  });
});

/**
 * Document Fetching Endpoints
 */

// Fetch a specific document by ID
app.get('/api/documents/:formId', async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { jurisdiction, agency } = req.query;
    
    if (!jurisdiction || !agency) {
      return res.status(400).json({
        error: {
          code: 'missing_parameters',
          message: 'Both jurisdiction and agency parameters are required'
        }
      });
    }
    
    // Check client tier for jurisdiction access
    if (!await req.client.hasJurisdictionAccess(jurisdiction)) {
      return res.status(403).json({
        error: {
          code: 'jurisdiction_access_denied',
          message: `Your subscription tier does not include access to ${jurisdiction}`
        }
      });
    }
    
    const document = await documentFetchService.fetchDocument(formId, jurisdiction, agency);
    
    // Track usage for billing and analytics
    req.trackUsage('document_fetch', document.metadata.formId);
    
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Get document metadata
app.get('/api/documents/:formId/metadata', async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { jurisdiction, agency } = req.query;
    
    if (!jurisdiction || !agency) {
      return res.status(400).json({
        error: {
          code: 'missing_parameters',
          message: 'Both jurisdiction and agency parameters are required'
        }
      });
    }
    
    const metadata = await documentFetchService.getDocumentMetadata(formId, jurisdiction, agency);
    
    // Track usage
    req.trackUsage('document_metadata_fetch');
    
    res.json(metadata);
  } catch (error) {
    next(error);
  }
});

// Check document status and updates
app.get('/api/documents/:formId/status', async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { jurisdiction, agency } = req.query;
    
    if (!jurisdiction || !agency) {
      return res.status(400).json({
        error: {
          code: 'missing_parameters',
          message: 'Both jurisdiction and agency parameters are required'
        }
      });
    }
    
    const status = await documentMonitorService.getDocumentStatus(formId, jurisdiction, agency);
    
    // Track usage
    req.trackUsage('document_status_check');
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Manually refresh a document
app.post('/api/documents/:formId/refresh', async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { jurisdiction, agency } = req.body;
    
    if (!jurisdiction || !agency) {
      return res.status(400).json({
        error: {
          code: 'missing_parameters',
          message: 'Both jurisdiction and agency parameters are required'
        }
      });
    }
    
    // Check client tier for manual refresh capability
    if (!req.client.hasFeature('manual_refresh')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Manual document refresh is not available on your current subscription tier'
        }
      });
    }
    
    const result = await documentMonitorService.refreshDocument(formId, jurisdiction, agency);
    
    // Track usage
    req.trackUsage('document_refresh', formId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// List all available documents
app.get('/api/documents', async (req, res, next) => {
  try {
    const { jurisdiction, formType, agency, isActive } = req.query;
    
    // Build filters
    const filters = {};
    
    if (jurisdiction) filters.jurisdiction = jurisdiction;
    if (formType) filters.formType = formType;
    if (agency) filters.agency = agency;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    // Check client tier for access to these jurisdictions
    if (jurisdiction && !await req.client.hasJurisdictionAccess(jurisdiction)) {
      return res.status(403).json({
        error: {
          code: 'jurisdiction_access_denied',
          message: `Your subscription tier does not include access to ${jurisdiction}`
        }
      });
    }
    
    // Apply pagination based on tier
    const pageSize = req.client.getTierLimit('pageSize');
    const page = parseInt(req.query.page) || 1;
    
    const result = await documentFetchService.listDocuments(filters, page, pageSize);
    
    // Track usage
    req.trackUsage('document_list');
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Compliance Monitoring Endpoints
 */

// Check company compliance
app.get('/api/compliance/check/company/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    // Check client tier for compliance checking
    if (!req.client.hasFeature('compliance_check')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Compliance checking is not available on your current subscription tier'
        }
      });
    }
    
    const result = await documentMonitorService.checkCompanyCompliance(companyId);
    
    // Track usage
    req.trackUsage('compliance_check_company', companyId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Check employee compliance
app.get('/api/compliance/check/employee/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    
    // Check client tier for compliance checking
    if (!req.client.hasFeature('compliance_check')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Compliance checking is not available on your current subscription tier'
        }
      });
    }
    
    const result = await documentMonitorService.checkEmployeeCompliance(employeeId);
    
    // Track usage
    req.trackUsage('compliance_check_employee', employeeId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Onboarding Endpoints
 */

// Get required documents for onboarding
app.get('/api/onboarding/documents', async (req, res, next) => {
  try {
    const { 
      jurisdiction, 
      companySize, 
      companyType, 
      hasEmployees, 
      hasForeignWorkers 
    } = req.query;
    
    if (!jurisdiction) {
      return res.status(400).json({
        error: {
          code: 'missing_parameter',
          message: 'The jurisdiction parameter is required'
        }
      });
    }
    
    // Check client tier for jurisdiction access
    if (!await req.client.hasJurisdictionAccess(jurisdiction)) {
      return res.status(403).json({
        error: {
          code: 'jurisdiction_access_denied',
          message: `Your subscription tier does not include access to ${jurisdiction}`
        }
      });
    }
    
    const documents = await integrationService.getRequiredDocuments(
      jurisdiction,
      companySize,
      companyType,
      hasEmployees === 'true',
      hasForeignWorkers === 'true'
    );
    
    // Track usage
    req.trackUsage('onboarding_documents_get');
    
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// Start company onboarding process
app.post('/api/onboarding/company', async (req, res, next) => {
  try {
    // Check client tier for onboarding capability
    if (!req.client.hasFeature('onboarding_workflow')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Onboarding workflow is not available on your current subscription tier'
        }
      });
    }
    
    const result = await integrationService.startCompanyOnboarding(req.body);
    
    // Track usage
    req.trackUsage('company_onboarding_start', result.companyId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Start employee onboarding process
app.post('/api/onboarding/employee', async (req, res, next) => {
  try {
    // Check client tier for onboarding capability
    if (!req.client.hasFeature('onboarding_workflow')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Onboarding workflow is not available on your current subscription tier'
        }
      });
    }
    
    const result = await integrationService.startEmployeeOnboarding(req.body);
    
    // Track usage
    req.trackUsage('employee_onboarding_start', result.employeeId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update document status in onboarding
app.patch('/api/onboarding/document/:checklistItemId', async (req, res, next) => {
  try {
    const { checklistItemId } = req.params;
    const { status, fileId } = req.body;
    
    if (!status) {
      return res.status(400).json({
        error: {
          code: 'missing_parameter',
          message: 'The status parameter is required'
        }
      });
    }
    
    const result = await integrationService.updateDocumentStatus(checklistItemId, status, fileId);
    
    // Track usage
    req.trackUsage('document_status_update', checklistItemId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Document Resource Management
 */

// List document resources
app.get('/api/resources', async (req, res, next) => {
  try {
    const { formId, jurisdiction, agency } = req.query;
    
    // Build filters
    const filters = {};
    
    if (formId) filters.formId = formId;
    if (jurisdiction) filters.jurisdiction = jurisdiction;
    if (agency) filters.agency = agency;
    
    const resources = await resourceManagerService.getDocumentResources(filters);
    
    // Track usage
    req.trackUsage('resources_list');
    
    res.json(resources);
  } catch (error) {
    next(error);
  }
});

// Get specific document resource
app.get('/api/resources/:resourceId', async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    
    const resource = await resourceManagerService.getDocumentResource(resourceId);
    
    // Track usage
    req.trackUsage('resource_get', resourceId);
    
    res.json(resource);
  } catch (error) {
    next(error);
  }
});

// Upload a document resource
app.post('/api/resources/upload', async (req, res, next) => {
  try {
    // Check client tier for resource upload capability
    if (!req.client.hasFeature('resource_upload')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Resource uploading is not available on your current subscription tier'
        }
      });
    }
    
    const result = await resourceManagerService.uploadDocumentResource(req);
    
    // Track usage
    req.trackUsage('resource_upload', result.resourceId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Analytics Endpoints
 */

// Get document update analytics
app.get('/api/analytics/updates', async (req, res, next) => {
  try {
    // Check client tier for analytics capability
    if (!req.client.hasFeature('analytics')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Analytics features are not available on your current subscription tier'
        }
      });
    }
    
    const { startDate, endDate, jurisdiction } = req.query;
    
    // Build filters
    const filters = {};
    
    if (startDate && endDate) {
      filters.dateRange = { startDate, endDate };
    }
    
    if (jurisdiction) {
      filters.jurisdiction = jurisdiction;
    }
    
    const analytics = await documentMonitorService.getDocumentUpdateAnalytics(filters);
    
    // Track usage
    req.trackUsage('analytics_updates');
    
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// Get compliance analytics
app.get('/api/analytics/compliance', async (req, res, next) => {
  try {
    // Check client tier for analytics capability
    if (!req.client.hasFeature('analytics')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Analytics features are not available on your current subscription tier'
        }
      });
    }
    
    const { jurisdiction } = req.query;
    
    // Build filters
    const filters = {};
    
    if (jurisdiction) {
      filters.jurisdiction = jurisdiction;
    }
    
    const analytics = await documentMonitorService.getComplianceAnalytics(filters);
    
    // Track usage
    req.trackUsage('analytics_compliance');
    
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

/**
 * Jurisdiction Information
 */

// Get supported jurisdictions
app.get('/api/jurisdictions', async (req, res, next) => {
  try {
    // Get client tier for filtering accessible jurisdictions
    const tierLevel = req.client.getTierLevel();
    
    const jurisdictions = await jurisdictionService.getJurisdictions(tierLevel);
    
    // Track usage
    req.trackUsage('jurisdictions_list');
    
    res.json(jurisdictions);
  } catch (error) {
    next(error);
  }
});

// Get specific jurisdiction details
app.get('/api/jurisdictions/:jurisdictionId', async (req, res, next) => {
  try {
    const { jurisdictionId } = req.params;
    
    const jurisdiction = await jurisdictionService.getJurisdictionDetails(jurisdictionId);
    
    // Check if client has access to this jurisdiction
    if (!await req.client.hasJurisdictionAccess(jurisdiction.code)) {
      return res.status(403).json({
        error: {
          code: 'jurisdiction_access_denied',
          message: `Your subscription tier does not include access to ${jurisdiction.name}`
        }
      });
    }
    
    // Track usage
    req.trackUsage('jurisdiction_get', jurisdictionId);
    
    res.json(jurisdiction);
  } catch (error) {
    next(error);
  }
});

/**
 * Integration Endpoints
 */

// Get integration status
app.get('/api/integration/status', async (req, res, next) => {
  try {
    const status = await integrationService.getIntegrationStatus(req.client.id);
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Configure integration settings
app.post('/api/integration/configure', async (req, res, next) => {
  try {
    // Check client tier for advanced integration capabilities
    if (!req.client.hasFeature('advanced_integration')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Advanced integration features are not available on your current subscription tier'
        }
      });
    }
    
    const result = await integrationService.configureIntegration(req.client.id, req.body);
    
    // Track usage
    req.trackUsage('integration_configure');
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Webhook Management
 */

// Register webhook for document updates
app.post('/api/webhooks', async (req, res, next) => {
  try {
    if (!req.client.hasFeature('webhooks')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Webhook notifications are not available on your current subscription tier'
        }
      });
    }
    
    if (!req.body.url || !req.body.events || !Array.isArray(req.body.events)) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'The request must include "url" and "events" array fields'
        }
      });
    }
    
    const result = await documentMonitorService.registerWebhook(
      req.client.id,
      req.body.url,
      req.body.events,
      req.body.secret || null
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// List registered webhooks
app.get('/api/webhooks', async (req, res, next) => {
  try {
    const webhooks = await documentMonitorService.getWebhooks(req.client.id);
    
    res.json({ webhooks });
  } catch (error) {
    next(error);
  }
});

// Delete a webhook
app.delete('/api/webhooks/:webhookId', async (req, res, next) => {
  try {
    await documentMonitorService.deleteWebhook(req.client.id, req.params.webhookId);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  if (err instanceof DocumentFetchError) {
    return res.status(400).json({
      error: {
        code: err.code || 'document_fetch_error',
        message: err.message,
        details: err.details || null
      }
    });
  }
  
  if (err instanceof JurisdictionError) {
    return res.status(400).json({
      error: {
        code: err.code || 'jurisdiction_error',
        message: err.message,
        details: err.details || null
      }
    });
  }
  
  // Handle other known error types...
  
  // Default error handler
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'An unexpected error occurred',
      requestId: uuidv4()
    }
  });
  
  // Log the error for internal tracking
  console.error('Unhandled API error:', {
    requestId: res.locals.requestId,
    clientId: req.client ? req.client.id : null,
    path: req.path,
    method: req.method,
    error: err
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DocuGinuity Document Fetching API running on port ${PORT}`);
  });
}

module.exports = app;