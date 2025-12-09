/**
 * Enhanced Saurellius Tax Engine API
 * 
 * A comprehensive, high-performance tax calculation system that handles
 * complex tax scenarios across 7,400+ tax jurisdictions with extreme precision.
 * 
 * Key Features:
 * - Ultra-fast processing (3ms average per calculation)
 * - Multi-jurisdiction support (federal, state, local)
 * - Multi-state calculations with reciprocity handling
 * - Geocoding precision for accurate jurisdiction determination
 * - Real-time tax updates with webhook notifications
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('./middleware/auth');
const taxCalculationService = require('./services/taxCalculationService');
const locationService = require('./services/locationService');
const taxRateService = require('./services/taxRateService');
const reciprocityService = require('./services/reciprocityService');
const webhookService = require('./services/webhookService');
const { TaxCalculationError, LocationError } = require('./utils/errors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Apply rate limiting based on client tier
app.use((req, res, next) => {
  // This will be replaced by the tier-specific rate limiter in the auth middleware
  next();
});

// Authenticate all API requests
app.use('/v1/', authenticate);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Saurellius Tax Engine API',
    version: '2.0.0',
    documentation: '/docs',
    status: 'operational'
  });
});

/**
 * Core Calculation Endpoints
 */

// Calculate taxes for a single employee
app.post('/v1/calculate', async (req, res, next) => {
  try {
    // Apply client tier-specific optimizations
    const calculationRequest = req.client.applyTierSettings(req.body);
    
    // Perform the calculation
    const result = await taxCalculationService.calculateTaxes(calculationRequest);
    
    // Track usage for billing and analytics
    req.trackUsage('calculate', result.calculationId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Calculate taxes for multiple employees in a batch
app.post('/v1/calculate/batch', async (req, res, next) => {
  try {
    // Validate client tier permissions for batch processing
    const maxBatchSize = req.client.getTierLimit('batchSize');
    
    if (req.body.employees && req.body.employees.length > maxBatchSize) {
      return res.status(403).json({
        error: {
          code: 'batch_size_exceeded',
          message: `Your subscription tier allows a maximum of ${maxBatchSize} employees per batch`
        }
      });
    }
    
    // Apply client tier-specific optimizations
    const batchRequest = req.client.applyTierSettings(req.body);
    
    // Process the batch calculation
    const result = await taxCalculationService.calculateBatchTaxes(batchRequest);
    
    // Track usage for billing and analytics
    req.trackUsage('calculate_batch', result.batchId, req.body.employees.length);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Calculate taxes for employees working in multiple states
app.post('/v1/multistate/calculate', async (req, res, next) => {
  try {
    // Validate client tier permissions for multistate calculations
    if (!req.client.hasFeature('multistate')) {
      return res.status(403).json({
        error: {
          code: 'feature_not_allowed',
          message: 'Multistate calculations are not available on your current subscription tier'
        }
      });
    }
    
    // Process the multistate calculation
    const result = await taxCalculationService.calculateMultistateTaxes(req.body);
    
    // Track usage for billing and analytics
    req.trackUsage('calculate_multistate', result.calculationId);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Location Services
 */

// Validate an address and determine tax jurisdictions
app.post('/v1/locations/validate', async (req, res, next) => {
  try {
    // Get geocoding precision based on client tier
    const precision = req.client.getTierSetting('geocodingPrecision');
    
    // Validate location with appropriate precision
    const result = await locationService.validateLocation(req.body.address, precision);
    
    // Track usage
    req.trackUsage('location_validate');
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get location by Saurellius location code
app.get('/v1/locations/:locationCode', async (req, res, next) => {
  try {
    const result = await locationService.getLocationByCode(req.params.locationCode);
    
    // Track usage
    req.trackUsage('location_get');
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Tax Rate & Jurisdiction Endpoints
 */

// Get jurisdiction information
app.get('/v1/jurisdictions/:jurisdictionId', async (req, res, next) => {
  try {
    const jurisdiction = await taxRateService.getJurisdiction(req.params.jurisdictionId);
    
    // Track usage
    req.trackUsage('jurisdiction_get');
    
    res.json(jurisdiction);
  } catch (error) {
    next(error);
  }
});

// Get tax rates
app.get('/v1/taxes/rates', async (req, res, next) => {
  try {
    const jurisdictionIds = req.query.jurisdictionIds ? req.query.jurisdictionIds.split(',') : [];
    const taxTypes = req.query.taxTypes ? req.query.taxTypes.split(',') : [];
    const effectiveDate = req.query.effectiveDate || new Date().toISOString().slice(0, 10);
    
    // Filter jurisdictions based on client tier
    const filteredJurisdictionIds = await req.client.filterJurisdictions(jurisdictionIds);
    
    const rates = await taxRateService.getTaxRates(
      filteredJurisdictionIds,
      taxTypes,
      effectiveDate
    );
    
    // Track usage
    req.trackUsage('tax_rates_get');
    
    res.json(rates);
  } catch (error) {
    next(error);
  }
});

// Get W-4 withholding recommendations
app.post('/v1/w4/calculate', async (req, res, next) => {
  try {
    // Determine which W-4 calculator to use based on tier
    const calculatorType = req.client.hasFeature('advanced_w4') ? 'advanced' : 'basic';
    
    const result = await taxCalculationService.calculateW4(req.body, calculatorType);
    
    // Track usage
    req.trackUsage('w4_calculate');
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get reciprocity rules between states
app.get('/v1/reciprocity/rules', async (req, res, next) => {
  try {
    if (!req.query.homeState || !req.query.workState) {
      return res.status(400).json({
        error: {
          code: 'missing_parameters',
          message: 'Both homeState and workState parameters are required'
        }
      });
    }
    
    const result = await reciprocityService.getReciprocityRules(
      req.query.homeState,
      req.query.workState
    );
    
    // Track usage
    req.trackUsage('reciprocity_get');
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Update Tracking Endpoints
 */

// Get tax updates since a specific date
app.get('/v1/taxes/updates', async (req, res, next) => {
  try {
    if (!req.query.since) {
      return res.status(400).json({
        error: {
          code: 'missing_parameter',
          message: 'The "since" date parameter is required'
        }
      });
    }
    
    const sinceDate = req.query.since;
    const jurisdictionIds = req.query.jurisdictionIds ? req.query.jurisdictionIds.split(',') : [];
    const taxTypes = req.query.taxTypes ? req.query.taxTypes.split(',') : [];
    
    // Filter jurisdictions based on client tier
    const filteredJurisdictionIds = await req.client.filterJurisdictions(jurisdictionIds);
    
    const updates = await taxRateService.getTaxUpdates(
      sinceDate,
      filteredJurisdictionIds,
      taxTypes
    );
    
    // Track usage
    req.trackUsage('tax_updates_get');
    
    res.json(updates);
  } catch (error) {
    next(error);
  }
});

/**
 * Data Management Endpoints
 */

// Create or update employee records
app.post('/v1/employees', async (req, res, next) => {
  try {
    if (!req.body.employees || !Array.isArray(req.body.employees) || req.body.employees.length === 0) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'The request must include an "employees" array with at least one employee'
        }
      });
    }
    
    const result = await taxCalculationService.createOrUpdateEmployees(
      req.client.id,
      req.body.employees
    );
    
    // Track usage
    req.trackUsage('employees_update', null, req.body.employees.length);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Webhook Management
 */

// Register a webhook
app.post('/v1/webhooks', async (req, res, next) => {
  try {
    if (!req.body.url || !req.body.events || !Array.isArray(req.body.events) || !req.body.secret) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'The request must include "url", "events" array, and "secret" fields'
        }
      });
    }
    
    const result = await webhookService.registerWebhook(
      req.client.id,
      req.body.url,
      req.body.events,
      req.body.secret
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// List registered webhooks
app.get('/v1/webhooks', async (req, res, next) => {
  try {
    const webhooks = await webhookService.getWebhooks(req.client.id);
    
    res.json({ webhooks });
  } catch (error) {
    next(error);
  }
});

// Delete a webhook
app.delete('/v1/webhooks/:webhookId', async (req, res, next) => {
  try {
    await webhookService.deleteWebhook(req.client.id, req.params.webhookId);
    
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
  
  if (err instanceof TaxCalculationError) {
    return res.status(400).json({
      error: {
        code: err.code || 'calculation_error',
        message: err.message,
        details: err.details || null
      }
    });
  }
  
  if (err instanceof LocationError) {
    return res.status(400).json({
      error: {
        code: err.code || 'location_error',
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
    console.log(`Saurellius Tax Engine API running on port ${PORT}`);
  });
}

module.exports = app;
