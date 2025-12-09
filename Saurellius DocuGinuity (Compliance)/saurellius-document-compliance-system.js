/**
 * Saurellius Document Compliance System
 * 
 * This system provides:
 * 1. Automated document fetching from government sources
 * 2. Regular compliance checks for document updates
 * 3. Integration with Saurellius Cloud Payroll & HR platform
 * 4. User notification and document update management
 */

// ----------------------------------------------
// Core System Architecture
// ----------------------------------------------

/**
 * Main application configuration
 */
const config = {
  schedulingFrequency: {
    dailyCheck: '0 1 * * *', // Run at 1 AM daily
    monthlyCheck: '0 0 1 * *', // Run at midnight on 1st of each month
    annualCheck: '0 0 1 1 *', // Run at midnight on January 1st
    quarterlyCheck: '0 0 1 */3 *' // Run at midnight on 1st of every 3rd month
  // ----------------------------------------------
// Main Application
// ----------------------------------------------

/**
 * SaurelliusDocumentComplianceSystem - Main application class
 */
class SaurelliusDocumentComplianceSystem {
  constructor() {
    // Initialize database provider
    this.databaseProvider = new DatabaseProvider();
    
    // Initialize repository
    this.documentRepository = new DocumentRepository(this.databaseProvider);
    
    // Initialize document fetcher
    this.documentFetcher = new DocumentFetcher();
    
    // Initialize document monitor
    this.documentMonitor = new DocumentMonitor(this.documentRepository);
    
    // Initialize API
    this.api = new ComplianceAPI(this.documentRepository, this.documentMonitor);
    
    // Initialize onboarding workflow
    this.onboardingWorkflow = new OnboardingWorkflow(this.documentRepository);
    
    // Initialize resource manager
    this.resourceManager = new ResourceManager(this.documentRepository);
    
    // Initialize notification service
    this.notificationService = new NotificationService();
  }
  
  /**
   * Initialize the system
   */
  async initialize() {
    console.log('Initializing Saurellius Document Compliance System');
    
    // Initialize database
    await this.databaseProvider.initialize();
    
    // Initialize document monitor schedules
    this.documentMonitor.initializeSchedules();
    
    // Initialize API
    await this.api.initialize();
    
    // Initialize resource manager
    await this.resourceManager.initialize();
    
    console.log('Saurellius Document Compliance System initialized successfully');
  }
  
  /**
   * Run the system
   */
  async run() {
    try {
      // Initialize the system
      await this.initialize();
      
      // Start the API server
      this.startApiServer();
      
      console.log('Saurellius Document Compliance System is running');
    } catch (error) {
      console.error(`Error starting Saurellius Document Compliance System: ${error.message}`);
      process.exit(1);
    }
  }
  
  /**
   * Start the API server
   */
  startApiServer() {
    // This would initialize an Express or similar server
    // This is a stub implementation
    console.log('API server started on port 3000');
  }
}

/**
 * DatabaseProvider - Handles database operations
 */
class DatabaseProvider {
  constructor() {
    // Initialize database client
    // This is a stub implementation
    this.dbClient = {
      // Collection methods
      findOne: async (collection, query) => {
        console.log(`Finding one in ${collection}: ${JSON.stringify(query)}`);
        return { id: '123', ...query };
      },
      find: async (collection, query) => {
        console.log(`Finding in ${collection}: ${JSON.stringify(query)}`);
        return [{ id: '123', ...query }, { id: '456', ...query }];
      },
      insert: async (collection, data) => {
        console.log(`Inserting into ${collection}: ${JSON.stringify(data)}`);
        return `${Date.now()}`;
      },
      update: async (collection, query, data) => {
        console.log(`Updating in ${collection}: ${JSON.stringify(query)} -> ${JSON.stringify(data)}`);
        return true;
      },
      delete: async (collection, query) => {
        console.log(`Deleting from ${collection}: ${JSON.stringify(query)}`);
        return true;
      }
    };
  }
  
  /**
   * Initialize the database
   */
  async initialize() {
    console.log('Initializing database');
    // In a real implementation, this would connect to the database
    // and create necessary collections/tables if they don't exist
  }
  
  /**
   * Find a single document
   */
  async findOne(collection, query) {
    return await this.dbClient.findOne(collection, query);
  }
  
  /**
   * Find multiple documents
   */
  async find(collection, query) {
    return await this.dbClient.find(collection, query);
  }
  
  /**
   * Insert a document
   */
  async insert(collection, data) {
    return await this.dbClient.insert(collection, data);
  }
  
  /**
   * Update documents
   */
  async update(collection, query, data) {
    return await this.dbClient.update(collection, query, data);
  }
  
  /**
   * Delete documents
   */
  async delete(collection, query) {
    return await this.dbClient.delete(collection, query);
  }
}

// ----------------------------------------------
// Run the application
// ----------------------------------------------

// Create and run the system
const complianceSystem = new SaurelliusDocumentComplianceSystem();
complianceSystem.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});

module.exports = {
  SaurelliusDocumentComplianceSystem,
  DocumentFetcher,
  DocumentMonitor,
  DocumentRepository,
  ComplianceAPI,
  OnboardingWorkflow,
  ResourceManager
};,
  sources: {
    federal: {
      irs: {
        baseUrl: 'https://www.irs.gov/forms-pubs',
        apiEndpoint: 'https://api.irs.gov/forms' // Example - would use actual IRS API
      },
      uscis: {
        baseUrl: 'https://www.uscis.gov/forms',
        apiEndpoint: 'https://api.uscis.gov/forms' // Example
      },
      dol: {
        baseUrl: 'https://www.dol.gov/agencies/whd/forms',
        apiEndpoint: 'https://api.dol.gov/forms' // Example
      },
      ssa: {
        baseUrl: 'https://www.ssa.gov/forms',
        apiEndpoint: 'https://api.ssa.gov/forms' // Example
      }
    },
    states: {
      // Mapping for all 50 states plus DC
      // Example for California
      CA: {
        taxBoard: {
          baseUrl: 'https://www.ftb.ca.gov/forms',
          apiEndpoint: 'https://api.ftb.ca.gov/forms' // Example
        },
        edd: {
          baseUrl: 'https://edd.ca.gov/en/Payroll_Taxes/Forms_and_Publications',
          apiEndpoint: 'https://api.edd.ca.gov/forms' // Example
        }
      },
      // Additional states would be defined similarly
    },
    territories: {
      // Puerto Rico, US Virgin Islands, Guam, American Samoa, Northern Mariana Islands
      PR: {
        hacienda: {
          baseUrl: 'https://www.hacienda.pr.gov/forms',
          apiEndpoint: 'https://api.hacienda.pr.gov/forms' // Example
        }
      }
      // Additional territories would be defined similarly
    }
  }
};

/**
 * Document metadata model - represents the schema for tracking document versions and updates
 */
class DocumentMetadata {
  constructor(formId, jurisdiction, agency, formType, currentVersion, lastUpdated, effectiveDate, expirationDate) {
    this.formId = formId;                 // Unique identifier for the form (e.g., "W-4", "I-9")
    this.jurisdiction = jurisdiction;     // Federal, state code, or territory code
    this.agency = agency;                 // Issuing agency (IRS, SSA, state tax board, etc.)
    this.formType = formType;             // Tax, employment, benefits, compliance, etc.
    this.currentVersion = currentVersion; // Current version identifier (often year-based)
    this.lastUpdated = lastUpdated;       // When this form was last updated
    this.effectiveDate = effectiveDate;   // When this form version becomes effective
    this.expirationDate = expirationDate; // When this form version expires (if applicable)
    this.changeLog = [];                  // History of changes to this document
    this.sourceUrl = null;                // URL to official source of the document
    this.documentHash = null;             // Content hash to detect changes
    this.isActive = true;                 // Whether this form is currently in effect
  }
  
  // Add a change to the changelog
  logChange(changeDate, changeType, changeDescription) {
    this.changeLog.push({
      date: changeDate,
      type: changeType, // 'minor', 'major', 'revision', etc.
      description: changeDescription
    });
  }
  
  // Check if this document is current or needs updating
  needsUpdate(currentDate = new Date()) {
    if (this.expirationDate && new Date(this.expirationDate) < currentDate) {
      return true;
    }
    // Additional logic for determining if a form needs updating
    return false;
  }
}

// ----------------------------------------------
// Core Document Fetching System
// ----------------------------------------------

/**
 * DocumentFetcher - Handles retrieval of documents from various sources
 */
class DocumentFetcher {
  constructor() {
    this.supportedSources = Object.keys(config.sources);
    this.httpClient = new HTTPClient(); // Abstract HTTP client for making API requests
    this.scrapers = {
      default: new WebScraper(), // Generic web scraper for sources without APIs
      irs: new IRSScraper(),     // Specialized scraper for IRS website
      ssa: new SSAScraper()      // Specialized scraper for SSA website
      // Additional specialized scrapers as needed
    };
  }
  
  /**
   * Fetch a specific document by ID from the appropriate source
   */
  async fetchDocument(formId, jurisdiction, agency) {
    try {
      // Determine the correct source configuration
      const sourceConfig = this.getSourceConfig(jurisdiction, agency);
      
      if (!sourceConfig) {
        throw new Error(`No source configuration found for ${jurisdiction}/${agency}`);
      }
      
      // Attempt API-based retrieval first
      if (sourceConfig.apiEndpoint) {
        try {
          return await this.fetchFromApi(sourceConfig.apiEndpoint, formId);
        } catch (apiError) {
          console.log(`API fetch failed for ${formId}: ${apiError.message}. Falling back to web scraping.`);
          // Fall back to web scraping if API fails
        }
      }
      
      // Use web scraping as fallback or primary method if no API
      return await this.fetchFromWebsite(sourceConfig.baseUrl, formId, jurisdiction, agency);
    } catch (error) {
      console.error(`Error fetching document ${formId} from ${jurisdiction}/${agency}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get source configuration based on jurisdiction and agency
   */
  getSourceConfig(jurisdiction, agency) {
    if (jurisdiction === 'federal') {
      return config.sources.federal[agency.toLowerCase()];
    } else if (jurisdiction.length === 2) {
      // State or territory
      if (config.sources.states[jurisdiction]) {
        return config.sources.states[jurisdiction][agency.toLowerCase()];
      } else if (config.sources.territories[jurisdiction]) {
        return config.sources.territories[jurisdiction][agency.toLowerCase()];
      }
    }
    return null;
  }
  
  /**
   * Fetch document using an API
   */
  async fetchFromApi(apiEndpoint, formId) {
    const response = await this.httpClient.get(`${apiEndpoint}/${formId}`);
    
    if (response.status === 200) {
      return {
        document: response.data.document,
        metadata: this.extractMetadataFromApiResponse(response.data, formId)
      };
    } else {
      throw new Error(`API returned status ${response.status}`);
    }
  }
  
  /**
   * Fetch document by scraping the agency website
   */
  async fetchFromWebsite(baseUrl, formId, jurisdiction, agency) {
    // Choose the appropriate scraper
    const scraper = this.scrapers[agency.toLowerCase()] || this.scrapers.default;
    
    // Scrape the document and its metadata
    const result = await scraper.scrapeDocument(baseUrl, formId, jurisdiction);
    
    return {
      document: result.document,
      metadata: result.metadata
    };
  }
  
  /**
   * Extract metadata from an API response
   */
  extractMetadataFromApiResponse(apiData, formId) {
    return new DocumentMetadata(
      formId,
      apiData.jurisdiction,
      apiData.agency,
      apiData.formType,
      apiData.version,
      apiData.lastUpdated,
      apiData.effectiveDate,
      apiData.expirationDate
    );
  }
}

/**
 * Abstract HTTP client for making API requests
 */
class HTTPClient {
  async get(url, headers = {}) {
    // Implementation would use fetch API, axios, or similar
    // This is a stub implementation
    try {
      // Simulate HTTP GET request
      console.log(`Making GET request to ${url}`);
      // In a real implementation, this would be:
      // const response = await fetch(url, { headers });
      // const data = await response.json();
      // return { status: response.status, data };
      
      // Simulated response for demonstration
      return {
        status: 200,
        data: {
          document: "Sample document content",
          jurisdiction: "federal",
          agency: "irs",
          formType: "tax",
          version: "2024",
          lastUpdated: "2024-01-15",
          effectiveDate: "2024-01-01",
          expirationDate: "2024-12-31"
        }
      };
    } catch (error) {
      console.error(`HTTP GET error: ${error.message}`);
      throw error;
    }
  }
  
  async post(url, data, headers = {}) {
    // Implementation for POST requests
    // This is a stub implementation
    try {
      console.log(`Making POST request to ${url}`);
      return { status: 200, data: { success: true } };
    } catch (error) {
      console.error(`HTTP POST error: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Base web scraper class
 */
class WebScraper {
  async scrapeDocument(baseUrl, formId, jurisdiction) {
    // Generic implementation to be overridden by specialized scrapers
    console.log(`Scraping ${formId} from ${baseUrl}`);
    
    // In a real implementation, this would:
    // 1. Navigate to the correct page
    // 2. Find the document download link
    // 3. Extract metadata from the page
    // 4. Download the document
    
    // Simulated response for demonstration
    return {
      document: "Sample scraped document content",
      metadata: new DocumentMetadata(
        formId,
        jurisdiction,
        "unknown", // Agency would be determined from the page
        "unknown", // Form type would be extracted
        "2024",    // Version would be extracted
        new Date().toISOString(),
        "2024-01-01",
        "2024-12-31"
      )
    };
  }
}

// Specialized scraper implementations would extend WebScraper
class IRSScraper extends WebScraper {
  // Specialized implementation for IRS website
}

class SSAScraper extends WebScraper {
  // Specialized implementation for SSA website
}

// ----------------------------------------------
// Compliance Monitoring System
// ----------------------------------------------

/**
 * DocumentMonitor - Checks for updates to known documents
 */
class DocumentMonitor {
  constructor(documentRepository) {
    this.repository = documentRepository;
    this.fetcher = new DocumentFetcher();
    this.scheduler = new ScheduleManager();
  }
  
  /**
   * Initialize monitoring schedules for different document types
   */
  initializeSchedules() {
    // Set up daily checks for high-priority documents
    this.scheduler.scheduleJob(config.schedulingFrequency.dailyCheck, () => {
      this.checkHighPriorityDocuments();
    });
    
    // Set up monthly checks for all documents
    this.scheduler.scheduleJob(config.schedulingFrequency.monthlyCheck, () => {
      this.checkAllDocuments();
    });
    
    // Set up annual comprehensive review
    this.scheduler.scheduleJob(config.schedulingFrequency.annualCheck, () => {
      this.performAnnualReview();
    });
    
    // Set up quarterly checks for tax-related documents
    this.scheduler.scheduleJob(config.schedulingFrequency.quarterlyCheck, () => {
      this.checkTaxDocuments();
    });
  }
  
  /**
   * Check all high-priority documents for updates
   */
  async checkHighPriorityDocuments() {
    const highPriorityForms = await this.repository.getHighPriorityForms();
    
    for (const form of highPriorityForms) {
      await this.checkDocumentForUpdates(form.formId, form.jurisdiction, form.agency);
    }
  }
  
  /**
   * Check all documents for updates
   */
  async checkAllDocuments() {
    const allForms = await this.repository.getAllActiveForms();
    
    for (const form of allForms) {
      await this.checkDocumentForUpdates(form.formId, form.jurisdiction, form.agency);
    }
  }
  
  /**
   * Perform annual comprehensive review of all documents
   */
  async performAnnualReview() {
    // Annual tax form updates typically occur at the beginning of the year
    await this.checkAnnualTaxForms();
    
    // Check for updates to employment forms
    await this.checkEmploymentForms();
    
    // Check for new compliance requirements
    await this.checkComplianceRequirements();
    
    // Generate annual compliance report
    await this.generateAnnualComplianceReport();
  }
  
  /**
   * Check tax-related documents
   */
  async checkTaxDocuments() {
    const taxForms = await this.repository.getFormsByType('tax');
    
    for (const form of taxForms) {
      await this.checkDocumentForUpdates(form.formId, form.jurisdiction, form.agency);
    }
  }
  
  /**
   * Check a specific document for updates
   */
  async checkDocumentForUpdates(formId, jurisdiction, agency) {
    try {
      // Get the current stored metadata
      const storedMetadata = await this.repository.getDocumentMetadata(formId, jurisdiction, agency);
      
      if (!storedMetadata) {
        console.log(`No stored metadata for ${formId}. Adding as new document.`);
        const newDoc = await this.fetcher.fetchDocument(formId, jurisdiction, agency);
        await this.repository.addDocument(newDoc.document, newDoc.metadata);
        return;
      }
      
      // Fetch the latest version from source
      const latestDoc = await this.fetcher.fetchDocument(formId, jurisdiction, agency);
      
      // Compare versions to detect changes
      if (this.hasDocumentChanged(storedMetadata, latestDoc.metadata)) {
        console.log(`Document ${formId} has been updated. Storing new version.`);
        
        // Log the change
        latestDoc.metadata.logChange(
          new Date().toISOString(),
          this.determineChangeType(storedMetadata, latestDoc.metadata),
          `Updated from version ${storedMetadata.currentVersion} to ${latestDoc.metadata.currentVersion}`
        );
        
        // Store the updated document
        await this.repository.updateDocument(formId, jurisdiction, agency, latestDoc.document, latestDoc.metadata);
        
        // Trigger notifications
        await this.notifyDocumentUpdate(formId, jurisdiction, agency, storedMetadata, latestDoc.metadata);
      } else {
        console.log(`No changes detected for ${formId}`);
        // Update last checked timestamp
        await this.repository.updateLastChecked(formId, jurisdiction, agency);
      }
    } catch (error) {
      console.error(`Error checking for updates to ${formId}: ${error.message}`);
      // Log the error and continue with other documents
    }
  }
  
  /**
   * Determine if a document has changed
   */
  hasDocumentChanged(storedMetadata, newMetadata) {
    // Compare version numbers
    if (storedMetadata.currentVersion !== newMetadata.currentVersion) {
      return true;
    }
    
    // Compare content hashes
    if (storedMetadata.documentHash !== newMetadata.documentHash) {
      return true;
    }
    
    // Compare effective dates
    if (storedMetadata.effectiveDate !== newMetadata.effectiveDate) {
      return true;
    }
    
    // Compare expiration dates
    if (storedMetadata.expirationDate !== newMetadata.expirationDate) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine the type of change (minor, major, revision)
   */
  determineChangeType(oldMetadata, newMetadata) {
    // Logic to determine if this is a major or minor change
    // For example, year changes might be major, small corrections minor
    
    // Version number change pattern analysis
    const oldVersionParts = oldMetadata.currentVersion.split('.');
    const newVersionParts = newMetadata.currentVersion.split('.');
    
    if (oldVersionParts[0] !== newVersionParts[0]) {
      return 'major'; // Major version number changed
    } else if (oldVersionParts.length > 1 && newVersionParts.length > 1 && 
               oldVersionParts[1] !== newVersionParts[1]) {
      return 'revision'; // Minor version number changed
    } else {
      return 'minor'; // Patch or very small change
    }
  }
  
  /**
   * Notify relevant parties about document updates
   */
  async notifyDocumentUpdate(formId, jurisdiction, agency, oldMetadata, newMetadata) {
    // Notify system administrators
    await notificationService.notifyAdmins({
      type: 'document_update',
      formId,
      jurisdiction,
      agency,
      oldVersion: oldMetadata.currentVersion,
      newVersion: newMetadata.currentVersion,
      effectiveDate: newMetadata.effectiveDate
    });
    
    // Notify affected customers
    const affectedUsers = await this.repository.getUsersAffectedByForm(formId, jurisdiction);
    
    for (const user of affectedUsers) {
      await notificationService.notifyUser(user.id, {
        type: 'document_update',
        formId,
        formName: this.getFormDisplayName(formId, jurisdiction),
        action: 'update_required',
        effectiveDate: newMetadata.effectiveDate
      });
    }
  }
  
  /**
   * Get a user-friendly display name for a form
   */
  getFormDisplayName(formId, jurisdiction) {
    // Convert technical form IDs to user-friendly names
    const formNames = {
      'W-4': 'Employee\'s Withholding Certificate',
      'I-9': 'Employment Eligibility Verification',
      'W-2': 'Wage and Tax Statement',
      '941': 'Employer\'s Quarterly Federal Tax Return'
      // Additional mappings as needed
    };
    
    return formNames[formId] || formId;
  }
  
  // Additional methods for specific document checks
  async checkAnnualTaxForms() {
    // Implementation for checking annual tax form updates
  }
  
  async checkEmploymentForms() {
    // Implementation for employment form checks
  }
  
  async checkComplianceRequirements() {
    // Implementation for compliance requirement checks
  }
  
  async generateAnnualComplianceReport() {
    // Generate comprehensive compliance report
  }
}

// ----------------------------------------------
// Document Storage and Management
// ----------------------------------------------

/**
 * DocumentRepository - Manages storage and retrieval of documents and metadata
 */
class DocumentRepository {
  constructor(databaseProvider) {
    this.db = databaseProvider;
    this.collection = {
      documents: 'compliance_documents',
      metadata: 'document_metadata',
      userAssociations: 'user_document_associations'
    };
  }
  
  /**
   * Add a new document to the repository
   */
  async addDocument(document, metadata) {
    try {
      // Store the document content
      const documentId = await this.db.insert(this.collection.documents, {
        formId: metadata.formId,
        jurisdiction: metadata.jurisdiction,
        agency: metadata.agency,
        content: document,
        contentType: this.determineContentType(document),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Store the metadata with a reference to the document
      await this.db.insert(this.collection.metadata, {
        ...metadata,
        documentId,
        lastChecked: new Date().toISOString()
      });
      
      return documentId;
    } catch (error) {
      console.error(`Error adding document ${metadata.formId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update an existing document
   */
  async updateDocument(formId, jurisdiction, agency, document, metadata) {
    try {
      // Find the existing document
      const existingDoc = await this.db.findOne(this.collection.documents, {
        formId,
        jurisdiction,
        agency
      });
      
      if (!existingDoc) {
        throw new Error(`Document ${formId} not found`);
      }
      
      // Update the document content
      await this.db.update(this.collection.documents, { _id: existingDoc._id }, {
        content: document,
        contentType: this.determineContentType(document),
        updatedAt: new Date().toISOString()
      });
      
      // Update the metadata
      await this.db.update(this.collection.metadata, {
        formId,
        jurisdiction,
        agency
      }, {
        ...metadata,
        documentId: existingDoc._id,
        lastChecked: new Date().toISOString()
      });
      
      return existingDoc._id;
    } catch (error) {
      console.error(`Error updating document ${formId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update the last checked timestamp for a document
   */
  async updateLastChecked(formId, jurisdiction, agency) {
    try {
      await this.db.update(this.collection.metadata, {
        formId,
        jurisdiction,
        agency
      }, {
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating last checked timestamp for ${formId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get metadata for a specific document
   */
  async getDocumentMetadata(formId, jurisdiction, agency) {
    try {
      return await this.db.findOne(this.collection.metadata, {
        formId,
        jurisdiction,
        agency
      });
    } catch (error) {
      console.error(`Error getting metadata for ${formId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a document by ID
   */
  async getDocument(formId, jurisdiction, agency) {
    try {
      return await this.db.findOne(this.collection.documents, {
        formId,
        jurisdiction,
        agency
      });
    } catch (error) {
      console.error(`Error getting document ${formId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all active forms
   */
  async getAllActiveForms() {
    try {
      return await this.db.find(this.collection.metadata, {
        isActive: true
      });
    } catch (error) {
      console.error(`Error getting all active forms: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get high priority forms
   */
  async getHighPriorityForms() {
    // Definition of high priority may vary by organization
    // For example, forms with approaching deadlines or widely used forms
    try {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      return await this.db.find(this.collection.metadata, {
        $or: [
          { priority: 'high' },
          { expirationDate: { $lt: oneMonthFromNow.toISOString() } }
        ]
      });
    } catch (error) {
      console.error(`Error getting high priority forms: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get forms by type
   */
  async getFormsByType(formType) {
    try {
      return await this.db.find(this.collection.metadata, {
        formType,
        isActive: true
      });
    } catch (error) {
      console.error(`Error getting forms by type ${formType}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get users affected by a specific form
   */
  async getUsersAffectedByForm(formId, jurisdiction) {
    try {
      // This would depend on your user management system
      // For example, finding users in a specific jurisdiction who use this form
      return await this.db.find('users', {
        'jurisdictions': jurisdiction,
        'activeForms': formId
      });
    } catch (error) {
      console.error(`Error getting users affected by form ${formId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Determine the content type of a document
   */
  determineContentType(document) {
    // Logic to identify if this is PDF, XML, HTML, etc.
    if (typeof document === 'string') {
      if (document.startsWith('%PDF')) {
        return 'application/pdf';
      } else if (document.startsWith('<?xml') || document.includes('<html>')) {
        return 'text/html';
      } else {
        return 'text/plain';
      }
    } else {
      // If it's a binary buffer or similar
      return 'application/octet-stream';
    }
  }
}

// ----------------------------------------------
// API and Integration Layer
// ----------------------------------------------

/**
 * ComplianceAPI - Main API for the compliance system
 */
class ComplianceAPI {
  constructor(documentRepository, documentMonitor) {
    this.repository = documentRepository;
    this.monitor = documentMonitor;
    this.integrationService = new SaurelliusIntegrationService(documentRepository);
  }
  
  /**
   * Initialize the API
   */
  async initialize() {
    console.log('Initializing Compliance API');
    
    // Initialize document monitor schedules
    this.monitor.initializeSchedules();
    
    // Initialize integration service
    await this.integrationService.initialize();
    
    // Register API endpoints
    this.registerEndpoints();
  }
  
  /**
   * Register API endpoints
   */
  registerEndpoints() {
    // Document management endpoints
    api.register('GET', '/api/compliance/documents', this.getAllDocuments.bind(this));
    api.register('GET', '/api/compliance/documents/:formId', this.getDocument.bind(this));
    api.register('POST', '/api/compliance/documents/:formId/refresh', this.refreshDocument.bind(this));
    
    // Compliance check endpoints
    api.register('GET', '/api/compliance/check/company/:companyId', this.checkCompanyCompliance.bind(this));
    api.register('GET', '/api/compliance/check/employee/:employeeId', this.checkEmployeeCompliance.bind(this));
    
    // Analytics endpoints
    api.register('GET', '/api/compliance/analytics/updates', this.getDocumentUpdateAnalytics.bind(this));
    api.register('GET', '/api/compliance/analytics/compliance', this.getComplianceAnalytics.bind(this));
  }
  
  /**
   * Get all documents
   */
  async getAllDocuments(req, res) {
    try {
      const { jurisdiction, formType, agency, isActive } = req.query;
      
      // Build query filters
      const filters = {};
      
      if (jurisdiction) filters.jurisdiction = jurisdiction;
      if (formType) filters.formType = formType;
      if (agency) filters.agency = agency;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      // Get documents matching the filters
      const documents = await this.repository.find(this.repository.collection.metadata, filters);
      
      res.status(200).json(documents);
    } catch (error) {
      console.error(`Error getting documents: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get a specific document
   */
  async getDocument(req, res) {
    try {
      const { formId } = req.params;
      const { jurisdiction, agency } = req.query;
      
      if (!jurisdiction || !agency) {
        return res.status(400).json({ error: 'Missing required parameters: jurisdiction and agency' });
      }
      
      const document = await this.repository.getDocument(formId, jurisdiction, agency);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      const metadata = await this.repository.getDocumentMetadata(formId, jurisdiction, agency);
      
      res.status(200).json({
        ...document,
        metadata
      });
    } catch (error) {
      console.error(`Error getting document: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Manually refresh a document
   */
  async refreshDocument(req, res) {
    try {
      const { formId } = req.params;
      const { jurisdiction, agency } = req.body;
      
      if (!jurisdiction || !agency) {
        return res.status(400).json({ error: 'Missing required parameters: jurisdiction and agency' });
      }
      
      // Check for document updates
      await this.monitor.checkDocumentForUpdates(formId, jurisdiction, agency);
      
      // Get updated metadata
      const metadata = await this.repository.getDocumentMetadata(formId, jurisdiction, agency);
      
      if (!metadata) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.status(200).json({
        formId,
        jurisdiction,
        agency,
        currentVersion: metadata.currentVersion,
        lastUpdated: metadata.lastUpdated,
        lastChecked: metadata.lastChecked,
        message: 'Document refresh completed'
      });
    } catch (error) {
      console.error(`Error refreshing document: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Check company compliance
   */
  async checkCompanyCompliance(req, res) {
    try {
      const { companyId } = req.params;
      
      // Get company profile
      const companyProfile = await companyService.getCompanyProfile(companyId);
      
      if (!companyProfile) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      // Get required documents
      const requiredDocs = await this.integrationService.getRequiredDocuments(
        companyProfile.jurisdiction,
        companyProfile.size,
        companyProfile.type,
        companyProfile.hasEmployees,
        companyProfile.hasForeignWorkers
      );
      
      // Get company document status
      const documentStatus = await this.repository.getCompanyDocumentStatus(companyId);
      
      // Calculate compliance status
      const complianceStatus = this.calculateComplianceStatus(requiredDocs, documentStatus);
      
      res.status(200).json({
        companyId,
        requiredDocuments: requiredDocs.length,
        completedDocuments: documentStatus.filter(doc => doc.status === 'completed').length,
        compliancePercentage: complianceStatus.percentage,
        complianceStatus: complianceStatus.status,
        documentStatus
      });
    } catch (error) {
      console.error(`Error checking company compliance: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Check employee compliance
   */
  async checkEmployeeCompliance(req, res) {
    try {
      const { employeeId } = req.params;
      
      // Get employee profile
      const employeeProfile = await employeeService.getEmployeeProfile(employeeId);
      
      if (!employeeProfile) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      // Get employee onboarding checklist
      const checklist = await this.repository.getEmployeeChecklist(employeeId);
      
      if (!checklist) {
        return res.status(404).json({ error: 'Checklist not found' });
      }
      
      // Get checklist items
      const checklistItems = await this.repository.getChecklistItems(checklist.id);
      
      // Calculate compliance status
      const totalItems = checklistItems.length;
      const completedItems = checklistItems.filter(item => item.status === 'completed').length;
      const requiredItems = checklistItems.filter(item => item.required).length;
      const completedRequiredItems = checklistItems.filter(item => item.required && item.status === 'completed').length;
      
      const compliancePercentage = requiredItems > 0 ? (completedRequiredItems / requiredItems) * 100 : 100;
      
      let complianceStatus = 'non_compliant';
      if (compliancePercentage === 100) {
        complianceStatus = 'compliant';
      } else if (compliancePercentage >= 75) {
        complianceStatus = 'partially_compliant';
      }
      
      res.status(200).json({
        employeeId,
        totalItems,
        completedItems,
        requiredItems,
        completedRequiredItems,
        compliancePercentage,
        complianceStatus,
        checklist: {
          id: checklist.id,
          status: checklist.status,
          createdAt: checklist.createdAt,
          updatedAt: checklist.updatedAt,
          completedAt: checklist.completedAt,
          items: checklistItems
        }
      });
    } catch (error) {
      console.error(`Error checking employee compliance: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get document update analytics
   */
  async getDocumentUpdateAnalytics(req, res) {
    try {
      const { startDate, endDate, jurisdiction } = req.query;
      
      // Build query filters
      const filters = {};
      
      if (startDate && endDate) {
        filters.lastUpdated = {
          $gte: startDate,
          $lte: endDate
        };
      }
      
      if (jurisdiction) {
        filters.jurisdiction = jurisdiction;
      }
      
      // Get document updates
      const documentUpdates = await this.repository.getDocumentUpdates(filters);
      
      // Process analytics
      const analytics = {
        totalUpdates: documentUpdates.length,
        updatesByJurisdiction: {},
        updatesByAgency: {},
        updatesByMonth: {},
        majorUpdates: 0,
        minorUpdates: 0
      };
      
      for (const update of documentUpdates) {
        // Count by jurisdiction
        if (!analytics.updatesByJurisdiction[update.jurisdiction]) {
          analytics.updatesByJurisdiction[update.jurisdiction] = 0;
        }
        analytics.updatesByJurisdiction[update.jurisdiction]++;
        
        // Count by agency
        if (!analytics.updatesByAgency[update.agency]) {
          analytics.updatesByAgency[update.agency] = 0;
        }
        analytics.updatesByAgency[update.agency]++;
        
        // Count by month
        const updateMonth = update.lastUpdated.substring(0, 7); // YYYY-MM
        if (!analytics.updatesByMonth[updateMonth]) {
          analytics.updatesByMonth[updateMonth] = 0;
        }
        analytics.updatesByMonth[updateMonth]++;
        
        // Count by change type
        if (update.changeLog && update.changeLog.length > 0) {
          const latestChange = update.changeLog[update.changeLog.length - 1];
          if (latestChange.type === 'major') {
            analytics.majorUpdates++;
          } else {
            analytics.minorUpdates++;
          }
        }
      }
      
      res.status(200).json(analytics);
    } catch (error) {
      console.error(`Error getting document update analytics: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get compliance analytics
   */
  async getComplianceAnalytics(req, res) {
    try {
      const { jurisdiction } = req.query;
      
      // Build query filters
      const filters = {};
      
      if (jurisdiction) {
        filters.jurisdiction = jurisdiction;
      }
      
      // Get company compliance data
      const companyCompliance = await this.repository.getCompanyComplianceData(filters);
      
      // Process analytics
      const analytics = {
        totalCompanies: companyCompliance.length,
        compliantCompanies: 0,
        partiallyCompliantCompanies: 0,
        nonCompliantCompanies: 0,
        complianceByJurisdiction: {},
        complianceByCompanySize: {
          small: { total: 0, compliant: 0 },
          medium: { total: 0, compliant: 0 },
          large: { total: 0, compliant: 0 }
        }
      };
      
      for (const company of companyCompliance) {
        // Count by compliance status
        if (company.complianceStatus === 'compliant') {
          analytics.compliantCompanies++;
        } else if (company.complianceStatus === 'partially_compliant') {
          analytics.partiallyCompliantCompanies++;
        } else {
          analytics.nonCompliantCompanies++;
        }
        
        // Count by jurisdiction
        if (!analytics.complianceByJurisdiction[company.jurisdiction]) {
          analytics.complianceByJurisdiction[company.jurisdiction] = {
            total: 0,
            compliant: 0
          };
        }
        analytics.complianceByJurisdiction[company.jurisdiction].total++;
        if (company.complianceStatus === 'compliant') {
          analytics.complianceByJurisdiction[company.jurisdiction].compliant++;
        }
        
        // Count by company size
        let sizeCategory = 'small';
        if (company.size >= 50 && company.size < 250) {
          sizeCategory = 'medium';
        } else if (company.size >= 250) {
          sizeCategory = 'large';
        }
        
        analytics.complianceByCompanySize[sizeCategory].total++;
        if (company.complianceStatus === 'compliant') {
          analytics.complianceByCompanySize[sizeCategory].compliant++;
        }
      }
      
      // Calculate percentages
      for (const jurisdiction in analytics.complianceByJurisdiction) {
        const data = analytics.complianceByJurisdiction[jurisdiction];
        analytics.complianceByJurisdiction[jurisdiction].percentage = 
          data.total > 0 ? (data.compliant / data.total) * 100 : 0;
      }
      
      for (const size in analytics.complianceByCompanySize) {
        const data = analytics.complianceByCompanySize[size];
        analytics.complianceByCompanySize[size].percentage = 
          data.total > 0 ? (data.compliant / data.total) * 100 : 0;
      }
      
      res.status(200).json(analytics);
    } catch (error) {
      console.error(`Error getting compliance analytics: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Calculate compliance status
   */
  calculateComplianceStatus(requiredDocs, documentStatus) {
    const required = requiredDocs.filter(doc => doc.required);
    const completed = documentStatus.filter(doc => doc.status === 'completed');
    
    // Match completed documents to required documents
    let completedRequiredCount = 0;
    
    for (const reqDoc of required) {
      const isCompleted = completed.some(doc => 
        doc.formId === reqDoc.formId && 
        doc.jurisdiction === reqDoc.jurisdiction &&
        doc.agency === reqDoc.agency
      );
      
      if (isCompleted) {
        completedRequiredCount++;
      }
    }
    
    // Calculate compliance percentage
    const percentage = required.length > 0 ? (completedRequiredCount / required.length) * 100 : 100;
    
    // Determine compliance status
    let status = 'non_compliant';
    if (percentage === 100) {
      status = 'compliant';
    } else if (percentage >= 75) {
      status = 'partially_compliant';
    }
    
    return {
      percentage,
      status,
      requiredCount: required.length,
      completedCount: completedRequiredCount
    };
  }
}

// ----------------------------------------------
// Onboarding Workflow Integration
// ----------------------------------------------

/**
 * OnboardingWorkflow - Manages document workflows during onboarding
 */
class OnboardingWorkflow {
  constructor(documentRepository) {
    this.repository = documentRepository;
  }
  
  /**
   * Start company onboarding workflow
   */
  async startCompanyOnboarding(companyData) {
    try {
      console.log(`Starting onboarding workflow for company ${companyData.name}`);
      
      // Create company record if it doesn't exist
      const companyId = await this.ensureCompanyExists(companyData);
      
      // Determine required documents based on company profile
      const requiredDocs = await this.getRequiredDocumentsForCompany(companyData);
      
      // Create onboarding checklist
      const checklistId = await this.createOnboardingChecklist(companyId, requiredDocs);
      
      // Send welcome notification with compliance requirements
      await notificationService.notifyUser(companyData.adminUserId, {
        type: 'onboarding',
        title: 'Welcome to Saurellius Cloud Payroll & HR Management!',
        message: 'We\'ve created your compliance document checklist. Please complete all required documents to ensure compliance.',
        action: 'view_checklist',
        checklistId
      });
      
      return {
        companyId,
        checklistId,
        requiredDocuments: requiredDocs.length
      };
    } catch (error) {
      console.error(`Error starting company onboarding: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ensure company exists in the system
   */
  async ensureCompanyExists(companyData) {
    // Check if company already exists
    const existingCompany = await companyService.getCompanyByTaxId(companyData.taxId);
    
    if (existingCompany) {
      return existingCompany.id;
    }
    
    // Create new company
    return await companyService.createCompany({
      name: companyData.name,
      taxId: companyData.taxId,
      jurisdiction: companyData.jurisdiction,
      size: companyData.size,
      type: companyData.type,
      hasEmployees: companyData.hasEmployees,
      hasForeignWorkers: companyData.hasForeignWorkers,
      adminUserId: companyData.adminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Get required documents for a company
   */
  async getRequiredDocumentsForCompany(companyData) {
    // This reuses the logic from SaurelliusIntegrationService
    const integrationService = new SaurelliusIntegrationService(this.repository);
    
    return await integrationService.getRequiredDocuments(
      companyData.jurisdiction,
      companyData.size,
      companyData.type,
      companyData.hasEmployees,
      companyData.hasForeignWorkers
    );
  }
  
  /**
   * Create onboarding checklist
   */
  async createOnboardingChecklist(companyId, requiredDocs) {
    // Create checklist record
    const checklistId = await this.repository.insert('company_onboarding_checklists', {
      companyId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    });
    
    // Create checklist items
    for (const doc of requiredDocs) {
      await this.repository.insert('company_onboarding_checklist_items', {
        checklistId,
        formId: doc.formId,
        jurisdiction: doc.jurisdiction,
        agency: doc.agency,
        status: 'pending',
        required: doc.required,
        priority: doc.priority,
        currentVersion: doc.currentVersion,
        effectiveDate: doc.effectiveDate,
        expirationDate: doc.expirationDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      });
    }
    
    return checklistId;
  }
  
  /**
   * Start employee onboarding workflow
   */
  async startEmployeeOnboarding(employeeData) {
    try {
      console.log(`Starting onboarding workflow for employee ${employeeData.name}`);
      
      // Create employee record if it doesn't exist
      const employeeId = await this.ensureEmployeeExists(employeeData);
      
      // Determine required documents for this employee
      const requiredDocs = await this.getRequiredDocumentsForEmployee(employeeData);
      
      // Create employee onboarding checklist
      const checklistId = await this.createEmployeeOnboardingChecklist(employeeId, requiredDocs);
      
      // Notify employer
      await notificationService.notifyUser(employeeData.employerId, {
        type: 'employee_onboarding',
        title: 'New Employee Onboarding',
        message: `Onboarding started for ${employeeData.name}. Please complete the required document checklist.`,
        action: 'view_employee_checklist',
        employeeId,
        checklistId
      });
      
      return {
        employeeId,
        checklistId,
        requiredDocuments: requiredDocs.length
      };
    } catch (error) {
      console.error(`Error starting employee onboarding: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ensure employee exists in the system
   */
  async ensureEmployeeExists(employeeData) {
    // Check if employee already exists
    const existingEmployee = await employeeService.getEmployeeByIdentifier(
      employeeData.companyId,
      employeeData.identifier
    );
    
    if (existingEmployee) {
      return existingEmployee.id;
    }
    
    // Create new employee
    return await employeeService.createEmployee({
      companyId: employeeData.companyId,
      name: employeeData.name,
      identifier: employeeData.identifier, // SSN or other identifier
      jurisdiction: employeeData.jurisdiction,
      employeeType: employeeData.employeeType,
      isForeignWorker: employeeData.isForeignWorker,
      hireDate: employeeData.hireDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Get required documents for an employee
   */
  async getRequiredDocumentsForEmployee(employeeData) {
    // This reuses the logic from SaurelliusIntegrationService
    const integrationService = new SaurelliusIntegrationService(this.repository);
    
    return await integrationService.getEmployeeOnboardingDocuments(
      employeeData.jurisdiction,
      employeeData.employeeType,
      employeeData.isForeignWorker
    );
  }
  
  /**
   * Create employee onboarding checklist
   */
  async createEmployeeOnboardingChecklist(employeeId, requiredDocs) {
    // Create checklist record
    const checklistId = await this.repository.insert('employee_onboarding_checklists', {
      employeeId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    });
    
    // Create checklist items
    for (const doc of requiredDocs) {
      await this.repository.insert('employee_onboarding_checklist_items', {
        checklistId,
        formId: doc.formId,
        jurisdiction: doc.jurisdiction,
        agency: doc.agency,
        status: 'pending',
        required: doc.required,
        priority: doc.priority,
        currentVersion: doc.currentVersion,
        effectiveDate: doc.effectiveDate,
        expirationDate: doc.expirationDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      });
    }
    
    return checklistId;
  }
  
  /**
   * Update document completion status
   */
  async updateDocumentStatus(checklistItemId, status, fileId = null) {
    try {
      // Update checklist item
      await this.repository.update('company_onboarding_checklist_items', {
        _id: checklistItemId
      }, {
        status,
        fileId,
        updatedAt: new Date().toISOString(),
        completedAt: status === 'completed' ? new Date().toISOString() : null
      });
      
      // Get checklist item to determine parent checklist
      const checklistItem = await this.repository.findOne('company_onboarding_checklist_items', {
        _id: checklistItemId
      });
      
      if (!checklistItem) {
        throw new Error(`Checklist item ${checklistItemId} not found`);
      }
      
      // Update checklist status if all required items are completed
      await this.updateChecklistStatus(checklistItem.checklistId);
      
      return {
        checklistItemId,
        status,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error updating document status: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update checklist status
   */
  async updateChecklistStatus(checklistId) {
    try {
      // Get all checklist items
      const items = await this.repository.find('company_onboarding_checklist_items', {
        checklistId
      });
      
      // Check if all required items are completed
      const requiredItems = items.filter(item => item.required);
      const completedRequiredItems = requiredItems.filter(item => item.status === 'completed');
      
      // Determine new status
      let newStatus = 'pending';
      
      if (completedRequiredItems.length === requiredItems.length) {
        newStatus = 'completed';
      } else if (completedRequiredItems.length > 0) {
        newStatus = 'in_progress';
      }
      
      // Update checklist
      await this.repository.update('company_onboarding_checklists', {
        _id: checklistId
      }, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        completedAt: newStatus === 'completed' ? new Date().toISOString() : null
      });
      
      // If completed, notify company admin
      if (newStatus === 'completed') {
        // Get company ID from checklist
        const checklist = await this.repository.findOne('company_onboarding_checklists', {
          _id: checklistId
        });
        
        if (checklist) {
          // Get company admin
          const company = await companyService.getCompany(checklist.companyId);
          
          if (company) {
            // Send notification
            await notificationService.notifyUser(company.adminUserId, {
              type: 'onboarding_completed',
              title: 'Onboarding Completed',
              message: 'All required compliance documents have been completed. Your company is now compliant!',
              action: 'view_dashboard'
            });
          }
        }
      }
      
      return {
        checklistId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error updating checklist status: ${error.message}`);
      throw error;
    }
  }
}

// ----------------------------------------------
// Document Resource Management
// ----------------------------------------------

/**
 * ResourceManager - Manages document resources
 */
class ResourceManager {
  constructor(documentRepository) {
    this.repository = documentRepository;
    this.fileStorage = new FileStorageService();
  }
  
  /**
   * Initialize resource manager
   */
  async initialize() {
    console.log('Initializing Resource Manager');
    
    // Register API endpoints
    this.registerEndpoints();
  }
  
  /**
   * Register API endpoints
   */
  registerEndpoints() {
    // Document resource endpoints
    api.register('GET', '/api/compliance/resources', this.getDocumentResources.bind(this));
    api.register('GET', '/api/compliance/resources/:resourceId', this.getDocumentResource.bind(this));
    api.register('POST', '/api/compliance/resources/upload', this.uploadDocumentResource.bind(this));
  }
  
  /**
   * Get document resources
   */
  async getDocumentResources(req, res) {
    try {
      const { formId, jurisdiction, agency } = req.query;
      
      // Build query filters
      const filters = {};
      
      if (formId) filters.formId = formId;
      if (jurisdiction) filters.jurisdiction = jurisdiction;
      if (agency) filters.agency = agency;
      
      // Get resources matching the filters
      const resources = await this.repository.find('document_resources', filters);
      
      res.status(200).json(resources);
    } catch (error) {
      console.error(`Error getting document resources: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get a specific document resource
   */
  async getDocumentResource(req, res) {
    try {
      const { resourceId } = req.params;
      
      const resource = await this.repository.findOne('document_resources', {
        _id: resourceId
      });
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Get download URL
      const downloadUrl = await this.fileStorage.getDownloadUrl(resource.fileId);
      
      res.status(200).json({
        ...resource,
        downloadUrl
      });
    } catch (error) {
      console.error(`Error getting document resource: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Upload a document resource
   */
  async uploadDocumentResource(req, res) {
    try {
      const { formId, jurisdiction, agency, resourceType, description } = req.body;
      const file = req.file;
      
      if (!formId || !jurisdiction || !agency || !resourceType || !file) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Upload file to storage
      const fileId = await this.fileStorage.uploadFile(file);
      
      // Create resource record
      const resourceId = await this.repository.insert('document_resources', {
        formId,
        jurisdiction,
        agency,
        resourceType,
        description,
        fileId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedBy: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Get download URL
      const downloadUrl = await this.fileStorage.getDownloadUrl(fileId);
      
      res.status(200).json({
        resourceId,
        formId,
        jurisdiction,
        agency,
        resourceType,
        description,
        fileId,
        fileName: file.originalname,
        downloadUrl
      });
    } catch (error) {
      console.error(`Error uploading document resource: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * FileStorageService - Handles file storage operations
 */
class FileStorageService {
  constructor() {
    // Initialize storage provider (S3, Azure, etc.)
    this.storageProvider = new S3StorageProvider({
      bucketName: 'saurellius-document-resources',
      region: 'us-west-2'
    });
  }
  
  /**
   * Upload a file to storage
   */
  async uploadFile(file) {
    try {
      // Generate unique file ID
      const fileId = `${Date.now()}-${this.generateRandomString(8)}`;
      
      // Create file path
      const filePath = `documents/${fileId}/${file.originalname}`;
      
      // Upload file to storage
      await this.storageProvider.uploadFile(filePath, file.buffer, file.mimetype);
      
      return fileId;
    } catch (error) {
      console.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get download URL for a file
   */
  async getDownloadUrl(fileId) {
    try {
      // Get file metadata
      const fileMeta = await this.storageProvider.getFileMetadata(fileId);
      
      if (!fileMeta) {
        throw new Error(`File metadata not found for ID ${fileId}`);
      }
      
      // Generate signed URL
      return await this.storageProvider.getSignedUrl(fileMeta.path);
    } catch (error) {
      console.error(`Error getting download URL: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a random string
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

/**
 * S3StorageProvider - AWS S3 storage implementation
 */
class S3StorageProvider {
  constructor(config) {
    this.bucketName = config.bucketName;
    this.region = config.region;
    
    // Initialize AWS S3 client
    // In a real implementation, this would use the AWS SDK
    this.s3Client = {
      // Stub implementation for demonstration
      putObject: async (params) => {
        console.log(`Uploading file to S3: ${params.Key}`);
        return { ETag: `"${this.generateRandomString(32)}"` };
      },
      getObject: async (params) => {
        console.log(`Getting file from S3: ${params.Key}`);
        return { Body: Buffer.from('Sample file content') };
      },
      getSignedUrl: async (operation, params) => {
        console.log(`Generating signed URL for ${params.Key}`);
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${params.Key}?signature=xxx`;
      }
    };
  }
  
  /**
   * Upload a file to S3
   */
  async uploadFile(filePath, fileBuffer, contentType) {
    try {
      await this.s3Client.putObject({
        Bucket: this.bucketName,
        Key: filePath,
        Body: fileBuffer,
        ContentType: contentType
      });
      
      return {
        path: filePath,
        bucket: this.bucketName
      };
    } catch (error) {
      console.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get file metadata
   */
  async getFileMetadata(fileId) {
    try {
      // In a real implementation, this would query a database
      // This is a stub implementation
      return {
        fileId,
        path: `documents/${fileId}/file.pdf`,
        bucket: this.bucketName,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error(`Error getting file metadata: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a signed URL for file download
   */
  async getSignedUrl(filePath) {
    try {
      return await this.s3Client.getSignedUrl('getObject', {
        Bucket: this.bucketName,
        Key: filePath,
        Expires: 3600 // URL valid for 1 hour
      });
    } catch (error) {
      console.error(`Error generating signed URL: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a random string
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}
class ScheduleManager {
  constructor() {
    this.scheduledJobs = {};
  }
  
  /**
   * Schedule a new job
   */
  scheduleJob(cronPattern, callback) {
    const jobId = `job_${Date.now()}`;
    
    // In a real implementation, this would use a library like node-cron
    // or a job scheduler like Bull
    console.log(`Scheduling job ${jobId} with pattern ${cronPattern}`);
    
    // For demonstration, we're just storing the callback
    this.scheduledJobs[jobId] = {
      pattern: cronPattern,
      callback,
      active: true
    };
    
    return jobId;
  }
  
  /**
   * Cancel a scheduled job
   */
  cancelJob(jobId) {
    if (this.scheduledJobs[jobId]) {
      console.log(`Cancelling job ${jobId}`);
      this.scheduledJobs[jobId].active = false;
      delete this.scheduledJobs[jobId];
      return true;
    }
    return false;
  }
}

/**
 * NotificationService - Handles system notifications
 */
class NotificationService {
  /**
   * Notify system administrators
   */
  async notifyAdmins(notification) {
    console.log(`Admin notification: ${JSON.stringify(notification)}`);
    // Implementation to send emails, Slack messages, etc.
  }
  
  /**
   * Notify a specific user
   */
  async notifyUser(userId, notification) {
    console.log(`User ${userId} notification: ${JSON.stringify(notification)}`);
    // Implementation to send in-app notifications, emails, etc.
  }
  
  /**
   * Send a broadcast notification to all users
   */
  async broadcastNotification(notification) {
    console.log(`Broadcast notification: ${JSON.stringify(notification)}`);
    // Implementation for system-wide notifications
  }
}

/**
 * SaurelliusIntegrationService - Handles integration with the main Saurellius platform
 */
class SaurelliusIntegrationService {
  constructor(documentRepository) {
    this.repository = documentRepository;
  }
  
  /**
   * Initialize the integration service
   */
  async initialize() {
    // Register API endpoints
    this.registerEndpoints();
    
    // Set up event listeners for Saurellius platform events
    this.setupEventListeners();
  }
  
  /**
   * Register API endpoints
   */
  registerEndpoints() {
    // Document retrieval endpoint
    api.register('GET', '/api/compliance/documents/:formId', this.getDocument.bind(this));
    
    // Document update status endpoint
    api.register('GET', '/api/compliance/documents/:formId/status', this.getDocumentStatus.bind(this));
    
    // Onboarding document list endpoint
    api.register('GET', '/api/compliance/onboarding/:jurisdiction', this.getOnboardingDocuments.bind(this));
    
    // User document requirements endpoint
    api.register('GET', '/api/compliance/requirements/:userId', this.getUserRequirements.bind(this));
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for user creation events
    events.on('user.created', this.handleUserCreated.bind(this));
    
    // Listen for jurisdiction change events
    events.on('user.jurisdiction.changed', this.handleJurisdictionChanged.bind(this));
    
    // Listen for employee onboarding events
    events.on('employee.onboarding.started', this.handleEmployeeOnboarding.bind(this));
  }
  
  /**
   * API handler for document retrieval
   */
  async getDocument(req, res) {
    try {
      const { formId } = req.params;
      const { jurisdiction, agency } = req.query;
      
      const document = await this.repository.getDocument(formId, jurisdiction, agency);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.status(200).json(document);
    } catch (error) {
      console.error(`Error retrieving document: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * API handler for document status
   */
  async getDocumentStatus(req, res) {
    try {
      const { formId } = req.params;
      const { jurisdiction, agency } = req.query;
      
      const metadata = await this.repository.getDocumentMetadata(formId, jurisdiction, agency);
      
      if (!metadata) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.status(200).json({
        formId: metadata.formId,
        jurisdiction: metadata.jurisdiction,
        agency: metadata.agency,
        currentVersion: metadata.currentVersion,
        lastUpdated: metadata.lastUpdated,
        effectiveDate: metadata.effectiveDate,
        expirationDate: metadata.expirationDate,
        isActive: metadata.isActive,
        lastChecked: metadata.lastChecked,
        needsUpdate: metadata.needsUpdate(new Date())
      });
    } catch (error) {
      console.error(`Error retrieving document status: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * API handler for onboarding document list
   */
  async getOnboardingDocuments(req, res) {
    try {
      const { jurisdiction } = req.params;
      const { companySize, companyType, hasEmployees, hasForeignWorkers } = req.query;
      
      // Get required documents based on company profile
      const requiredDocs = await this.getRequiredDocuments(
        jurisdiction, 
        companySize, 
        companyType, 
        hasEmployees === 'true', 
        hasForeignWorkers === 'true'
      );
      
      res.status(200).json(requiredDocs);
    } catch (error) {
      console.error(`Error retrieving onboarding documents: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * API handler for user document requirements
   */
  async getUserRequirements(req, res) {
    try {
      const { userId } = req.params;
      
      // Get user profile
      const userProfile = await userService.getUserProfile(userId);
      
      if (!userProfile) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get required documents based on user profile
      const requiredDocs = await this.getRequiredDocumentsForUser(userProfile);
      
      res.status(200).json(requiredDocs);
    } catch (error) {
      console.error(`Error retrieving user requirements: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Event handler for user creation
   */
  async handleUserCreated(user) {
    try {
      // Set up initial document requirements
      await this.initializeUserDocuments(user);
      
      // Send welcome notification with document checklist
      await notificationService.notifyUser(user.id, {
        type: 'onboarding',
        title: 'Welcome to Saurellius!',
        message: 'Please complete your document checklist to ensure compliance.',
        action: 'view_checklist'
      });
    } catch (error) {
      console.error(`Error handling user creation: ${error.message}`);
    }
  }
  
  /**
   * Event handler for jurisdiction change
   */
  async handleJurisdictionChanged(userId, oldJurisdiction, newJurisdiction) {
    try {
      // Get user profile
      const userProfile = await userService.getUserProfile(userId);
      
      // Update document requirements
      await this.updateUserDocumentRequirements(userProfile, oldJurisdiction, newJurisdiction);
      
      // Notify user of new requirements
      await notificationService.notifyUser(userId, {
        type: 'jurisdiction_change',
        title: 'Jurisdiction Change Detected',
        message: `Your jurisdiction has changed from ${oldJurisdiction} to ${newJurisdiction}. Please review your updated document requirements.`,
        action: 'view_requirements'
      });
    } catch (error) {
      console.error(`Error handling jurisdiction change: ${error.message}`);
    }
  }
  
  /**
   * Event handler for employee onboarding
   */
  async handleEmployeeOnboarding(employeeData) {
    try {
      // Get required onboarding documents
      const requiredDocs = await this.getEmployeeOnboardingDocuments(
        employeeData.jurisdiction,
        employeeData.employeeType,
        employeeData.isForeignWorker
      );
      
      // Create employee onboarding checklist
      await this.createEmployeeOnboardingChecklist(employeeData.id, requiredDocs);
      
      // Notify employer of required documents
      await notificationService.notifyUser(employeeData.employerId, {
        type: 'employee_onboarding',
        title: 'New Employee Onboarding',
        message: `Onboarding started for ${employeeData.name}. Please complete the required document checklist.`,
        action: 'view_employee_checklist',
        employeeId: employeeData.id
      });
    } catch (error) {
      console.error(`Error handling employee onboarding: ${error.message}`);
    }
  }
  
  /**
   * Get required documents based on company profile
   */
  async getRequiredDocuments(jurisdiction, companySize, companyType, hasEmployees, hasForeignWorkers) {
    // Define document requirements based on company profile
    const requiredDocs = [];
    
    // Federal forms required for all employers
    if (hasEmployees) {
      requiredDocs.push(
        { formId: 'I-9', jurisdiction: 'federal', agency: 'uscis', required: true, priority: 'high' },
        { formId: 'W-4', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'high' }
      );
      
      // Add state-specific forms
      if (jurisdiction !== 'federal') {
        // Get state withholding form equivalent
        const stateWithholdingForm = await this.repository.findOne(
          'state_specific_forms',
          { jurisdiction, type: 'withholding' }
        );
        
        if (stateWithholdingForm) {
          requiredDocs.push({
            formId: stateWithholdingForm.formId,
            jurisdiction,
            agency: stateWithholdingForm.agency,
            required: true,
            priority: 'high'
          });
        }
        
        // Get state new hire reporting form
        const stateNewHireForm = await this.repository.findOne(
          'state_specific_forms',
          { jurisdiction, type: 'new_hire_reporting' }
        );
        
        if (stateNewHireForm) {
          requiredDocs.push({
            formId: stateNewHireForm.formId,
            jurisdiction,
            agency: stateNewHireForm.agency,
            required: true,
            priority: 'high'
          });
        }
      }
    }
    
    // Tax reporting forms
    requiredDocs.push(
      { formId: '941', jurisdiction: 'federal', agency: 'irs', required: hasEmployees, priority: 'medium' },
      { formId: '940', jurisdiction: 'federal', agency: 'irs', required: hasEmployees, priority: 'medium' },
      { formId: 'W-2', jurisdiction: 'federal', agency: 'irs', required: hasEmployees, priority: 'medium' },
      { formId: 'W-3', jurisdiction: 'federal', agency: 'irs', required: hasEmployees, priority: 'medium' }
    );
    
    // Independent contractor forms
    requiredDocs.push(
      { formId: 'W-9', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'medium' },
      { formId: '1099-NEC', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'medium' },
      { formId: '1096', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'medium' }
    );
    
    // ACA forms for large employers
    if (companySize >= 50) {
      requiredDocs.push(
        { formId: '1095-C', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'medium' },
        { formId: '1094-C', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'medium' }
      );
    }
    
    // Foreign worker documentation
    if (hasForeignWorkers) {
      requiredDocs.push(
        { formId: 'W-8BEN', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'high' },
        { formId: '1042-S', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'medium' }
      );
    }
    
    // Fetch the current metadata for each required document
    for (let i = 0; i < requiredDocs.length; i++) {
      const doc = requiredDocs[i];
      const metadata = await this.repository.getDocumentMetadata(
        doc.formId,
        doc.jurisdiction,
        doc.agency
      );
      
      if (metadata) {
        requiredDocs[i] = {
          ...doc,
          currentVersion: metadata.currentVersion,
          effectiveDate: metadata.effectiveDate,
          expirationDate: metadata.expirationDate,
          lastUpdated: metadata.lastUpdated
        };
      }
    }
    
    return requiredDocs;
  }
  
  /**
   * Get required documents for a specific user
   */
  async getRequiredDocumentsForUser(userProfile) {
    // Get base document requirements
    const requiredDocs = await this.getRequiredDocuments(
      userProfile.jurisdiction,
      userProfile.companySize,
      userProfile.companyType,
      userProfile.hasEmployees,
      userProfile.hasForeignWorkers
    );
    
    // Add user-specific document requirements
    const userSpecificDocs = await this.repository.find(
      'user_document_requirements',
      { userId: userProfile.id }
    );
    
    return [...requiredDocs, ...userSpecificDocs];
  }
  
  /**
   * Initialize user document requirements
   */
  async initializeUserDocuments(user) {
    // Get required documents based on user profile
    const requiredDocs = await this.getRequiredDocumentsForUser(user);
    
    // Create user document associations
    for (const doc of requiredDocs) {
      await this.repository.insert('user_document_associations', {
        userId: user.id,
        formId: doc.formId,
        jurisdiction: doc.jurisdiction,
        agency: doc.agency,
        required: doc.required,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  /**
   * Update user document requirements
   */
  async updateUserDocumentRequirements(userProfile, oldJurisdiction, newJurisdiction) {
    // Get old jurisdiction required documents
    const oldDocs = await this.getRequiredDocuments(
      oldJurisdiction,
      userProfile.companySize,
      userProfile.companyType,
      userProfile.hasEmployees,
      userProfile.hasForeignWorkers
    );
    
    // Get new jurisdiction required documents
    const newDocs = await this.getRequiredDocuments(
      newJurisdiction,
      userProfile.companySize,
      userProfile.companyType,
      userProfile.hasEmployees,
      userProfile.hasForeignWorkers
    );
    
    // Identify documents to remove (in old but not in new)
    const docsToRemove = oldDocs.filter(oldDoc => 
      !newDocs.some(newDoc => 
        newDoc.formId === oldDoc.formId && 
        newDoc.jurisdiction === oldDoc.jurisdiction &&
        newDoc.agency === oldDoc.agency
      )
    );
    
    // Identify documents to add (in new but not in old)
    const docsToAdd = newDocs.filter(newDoc => 
      !oldDocs.some(oldDoc => 
        oldDoc.formId === newDoc.formId && 
        oldDoc.jurisdiction === newDoc.jurisdiction &&
        oldDoc.agency === newDoc.agency
      )
    );
    
    // Remove old jurisdiction documents
    for (const doc of docsToRemove) {
      await this.repository.update(
        'user_document_associations',
        {
          userId: userProfile.id,
          formId: doc.formId,
          jurisdiction: doc.jurisdiction,
          agency: doc.agency
        },
        {
          required: false,
          status: 'inactive',
          updatedAt: new Date().toISOString()
        }
      );
    }
    
    // Add new jurisdiction documents
    for (const doc of docsToAdd) {
      await this.repository.insert('user_document_associations', {
        userId: userProfile.id,
        formId: doc.formId,
        jurisdiction: doc.jurisdiction,
        agency: doc.agency,
        required: doc.required,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  /**
   * Get employee onboarding documents
   */
  async getEmployeeOnboardingDocuments(jurisdiction, employeeType, isForeignWorker) {
    const requiredDocs = [];
    
    // Federal employment forms
    requiredDocs.push(
      { formId: 'I-9', jurisdiction: 'federal', agency: 'uscis', required: true, priority: 'high' },
      { formId: 'W-4', jurisdiction: 'federal', agency: 'irs', required: true, priority: 'high' }
    );
    
    // State withholding form
    if (jurisdiction !== 'federal') {
      const stateWithholdingForm = await this.repository.findOne(
        'state_specific_forms',
        { jurisdiction, type: 'withholding' }
      );
      
      if (stateWithholdingForm) {
        requiredDocs.push({
          formId: stateWithholdingForm.formId,
          jurisdiction,
          agency: stateWithholdingForm.agency,
          required: true,
          priority: 'high'
        });
      }
    }
    
    // Foreign worker documentation
    if (isForeignWorker) {
      requiredDocs.push(
        { formId: 'Foreign Worker Supplement', jurisdiction: 'federal', agency: 'uscis', required: true, priority: 'high' }
      );
    }
    
    // Fetch the current metadata for each required document
    for (let i = 0; i < requiredDocs.length; i++) {
      const doc = requiredDocs[i];
      const metadata = await this.repository.getDocumentMetadata(
        doc.formId,
        doc.jurisdiction,
        doc.agency
      );
      
      if (metadata) {
        requiredDocs[i] = {
          ...doc,
          currentVersion: metadata.currentVersion,
          effectiveDate: metadata.effectiveDate,
          expirationDate: metadata.expirationDate,
          lastUpdated: metadata.lastUpdated
        };
      }
    }
    
    return requiredDocs;
  }
  
  /**
   * Create employee onboarding checklist
   */
  async createEmployeeOnboardingChecklist(employeeId, requiredDocs) {
    // Create checklist record
    const checklistId = await this.repository.insert('employee_document_checklists', {
      employeeId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    });
    
    // Create checklist items
    for (const doc of requiredDocs) {
      await this.repository.insert('employee_document_checklist_items', {
        checklistId,
        formId: doc.formId,
        jurisdiction: doc.jurisdiction,
        agency: doc.agency,
        status: 'pending',
        required: doc.required,
        priority: doc.priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      });
    }
    
    return checklistId;
  }
}