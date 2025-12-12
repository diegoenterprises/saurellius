// services/taxRateService.js - Tax rate retrieval and management

const { dbQuery } = require('../database/taxDatabase');
const { TaxRateError } = require('../utils/errors');
const { cache } = require('../utils/cache');

/**
 * Service for managing and retrieving tax rates
 */
class TaxRateService {
  /**
   * Get federal tax rates for a specific date
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Object} Federal tax rates
   */
  async getFederalTaxRates(effectiveDate = new Date().toISOString().slice(0, 10)) {
    try {
      // Try to get from cache first
      const cacheKey = `federal_tax_rates:${effectiveDate}`;
      const cachedRates = cache.get(cacheKey);
      
      if (cachedRates) {
        return cachedRates;
      }
      
      // Query database for federal rates
      const query = `
        SELECT 
          tax_id,
          tax_name,
          tax_type,
          rate,
          flat_amount,
          minimum_wage,
          maximum_wage,
          effective_date,
          expiration_date,
          brackets
        FROM 
          tax_rates
        WHERE 
          jurisdiction_id = 'FED'
          AND effective_date <= ?
          AND (expiration_date IS NULL OR expiration_date >= ?)
      `;
      
      const results = await dbQuery(query, [effectiveDate, effectiveDate]);
      
      if (results.length === 0) {
        throw new TaxRateError(
          'federal_rates_not_found',
          `No federal tax rates found for date: ${effectiveDate}`
        );
      }
      
      // Process the results
      const federalRates = {};
      
      for (const row of results) {
        // If the tax has brackets, parse the JSON brackets field
        if (row.brackets) {
          row.brackets = JSON.parse(row.brackets);
        }
        
        federalRates[row.tax_type] = this._mapTaxRateRow(row);
      }
      
      // Add constants for federal taxes
      federalRates.constants = {
        socialSecurityWageBase: this.getSocialSecurityWageBase(effectiveDate),
        additionalMedicareThreshold: 200000, // Fixed amount for Additional Medicare Tax
        standardDeduction: this._getFederalStandardDeduction(effectiveDate)
      };
      
      // Store in cache
      cache.set(cacheKey, federalRates, 3600); // Cache for 1 hour
      
      return federalRates;
    } catch (error) {
      if (error instanceof TaxRateError) {
        throw error;
      } else {
        throw new TaxRateError(
          'federal_rate_error',
          `Failed to get federal tax rates: ${error.message}`,
          error
        );
      }
    }
  }
  
  /**
   * Get state tax rates for a specific state and date
   * @param {string} stateCode - Two-letter state code
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Object} State tax rates
   */
  async getStateTaxRates(stateCode, effectiveDate = new Date().toISOString().slice(0, 10)) {
    try {
      // Try to get from cache first
      const cacheKey = `state_tax_rates:${stateCode}:${effectiveDate}`;
      const cachedRates = cache.get(cacheKey);
      
      if (cachedRates) {
        return cachedRates;
      }
      
      // Get the jurisdiction ID for this state
      const jurisdictionQuery = `
        SELECT jurisdiction_id
        FROM jurisdictions
        WHERE jurisdiction_type = 'state' AND state_code = ?
      `;
      
      const jurisdictionResults = await dbQuery(jurisdictionQuery, [stateCode]);
      
      if (jurisdictionResults.length === 0) {
        throw new TaxRateError(
          'state_jurisdiction_not_found',
          `No jurisdiction found for state: ${stateCode}`
        );
      }
      
      const jurisdictionId = jurisdictionResults[0].jurisdiction_id;
      
      // Query database for state rates
      const query = `
        SELECT 
          tax_id,
          tax_name,
          tax_type,
          rate,
          flat_amount,
          minimum_wage,
          maximum_wage,
          effective_date,
          expiration_date,
          brackets
        FROM 
          tax_rates
        WHERE 
          jurisdiction_id = ?
          AND effective_date <= ?
          AND (expiration_date IS NULL OR expiration_date >= ?)
      `;
      
      const results = await dbQuery(query, [jurisdictionId, effectiveDate, effectiveDate]);
      
      if (results.length === 0) {
        throw new TaxRateError(
          'state_rates_not_found',
          `No tax rates found for state: ${stateCode} on date: ${effectiveDate}`
        );
      }
      
      // Process the results
      const stateRates = {};
      
      for (const row of results) {
        // If the tax has brackets, parse the JSON brackets field
        if (row.brackets) {
          row.brackets = JSON.parse(row.brackets);
        }
        
        stateRates[row.tax_type] = this._mapTaxRateRow(row);
      }
      
      // Get state-specific constants
      stateRates.constants = await this._getStateConstants(stateCode, effectiveDate);
      
      // Get flags for state-specific taxes
      stateRates.hasSDI = 'disability_insurance' in stateRates;
      stateRates.hasEmployeeSUI = 'employee_unemployment' in stateRates;
      stateRates.hasPaidFamilyLeave = 'paid_family_leave' in stateRates;
      
      // Get additional employer taxes for this state
      stateRates.additionalEmployerTaxes = await this._getAdditionalEmployerTaxes(
        stateCode,
        effectiveDate
      );
      
      // Store in cache
      cache.set(cacheKey, stateRates, 3600); // Cache for 1 hour
      
      return stateRates;
    } catch (error) {
      if (error instanceof TaxRateError) {
        throw error;
      } else {
        throw new TaxRateError(
          'state_rate_error',
          `Failed to get state tax rates: ${error.message}`,
          error
        );
      }
    }
  }
  
  /**
   * Get local tax rates for a specific jurisdiction and date
   * @param {string} jurisdictionId - Jurisdiction ID
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Array} Local tax rates
   */
  async getLocalTaxRates(jurisdictionId, effectiveDate = new Date().toISOString().slice(0, 10)) {
    try {
      // Try to get from cache first
      const cacheKey = `local_tax_rates:${jurisdictionId}:${effectiveDate}`;
      const cachedRates = cache.get(cacheKey);
      
      if (cachedRates) {
        return cachedRates;
      }
      
      // Query database for local rates
      const query = `
        SELECT 
          tax_id,
          tax_name,
          tax_type,
          rate,
          flat_amount,
          minimum_wage,
          maximum_wage,
          effective_date,
          expiration_date,
          brackets
        FROM 
          tax_rates
        WHERE 
          jurisdiction_id = ?
          AND effective_date <= ?
          AND (expiration_date IS NULL OR expiration_date >= ?)
      `;
      
      const results = await dbQuery(query, [jurisdictionId, effectiveDate, effectiveDate]);
      
      // If no specific rates, that's not necessarily an error
      if (results.length === 0) {
        return [];
      }
      
      // Process the results
      const localRates = results.map(row => {
        // If the tax has brackets, parse the JSON brackets field
        if (row.brackets) {
          row.brackets = JSON.parse(row.brackets);
        }
        
        return this._mapTaxRateRow(row);
      });
      
      // Store in cache
      cache.set(cacheKey, localRates, 3600); // Cache for 1 hour
      
      return localRates;
    } catch (error) {
      if (error instanceof TaxRateError) {
        throw error;
      } else {
        throw new TaxRateError(
          'local_rate_error',
          `Failed to get local tax rates: ${error.message}`,
          error
        );
      }
    }
  }
  
  /**
   * Get tax rates for multiple jurisdictions
   * @param {Array} jurisdictionIds - Array of jurisdiction IDs
   * @param {Array} taxTypes - Array of tax types to include
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Array} Tax rates for specified jurisdictions
   */
  async getTaxRates(
    jurisdictionIds,
    taxTypes = [],
    effectiveDate = new Date().toISOString().slice(0, 10)
  ) {
    try {
      // Build query conditions
      const conditions = [];
      const params = [];
      
      // Add jurisdiction condition
      if (jurisdictionIds && jurisdictionIds.length > 0) {
        const placeholders = jurisdictionIds.map(() => '?').join(', ');
        conditions.push(`jurisdiction_id IN (${placeholders})`);
        params.push(...jurisdictionIds);
      }
      
      // Add tax types condition
      if (taxTypes && taxTypes.length > 0) {
        const placeholders = taxTypes.map(() => '?').join(', ');
        conditions.push(`tax_type IN (${placeholders})`);
        params.push(...taxTypes);
      }
      
      // Add date conditions
      conditions.push('effective_date <= ?');
      conditions.push('(expiration_date IS NULL OR expiration_date >= ?)');
      params.push(effectiveDate, effectiveDate);
      
      // Build the full query
      const query = `
        SELECT
          tr.tax_id,
          tr.jurisdiction_id,
          j.jurisdiction_name,
          j.jurisdiction_type,
          tr.tax_name,
          tr.tax_type,
          tr.rate,
          tr.flat_amount,
          tr.minimum_wage,
          tr.maximum_wage,
          tr.effective_date,
          tr.expiration_date,
          tr.brackets
        FROM
          tax_rates tr
          JOIN jurisdictions j ON tr.jurisdiction_id = j.jurisdiction_id
        WHERE
          ${conditions.join(' AND ')}
        ORDER BY
          j.jurisdiction_type,
          j.jurisdiction_name,
          tr.tax_type
      `;
      
      const results = await dbQuery(query, params);
      
      // Process the results
      const taxRates = results.map(row => {
        // If the tax has brackets, parse the JSON brackets field
        if (row.brackets) {
          row.brackets = JSON.parse(row.brackets);
        }
        
        return {
          jurisdictionId: row.jurisdiction_id,
          jurisdictionName: row.jurisdiction_name,
          jurisdictionType: row.jurisdiction_type,
          ...this._mapTaxRateRow(row)
        };
      });
      
      return {
        effectiveDate,
        rates: taxRates
      };
    } catch (error) {
      throw new TaxRateError(
        'tax_rates_error',
        `Failed to get tax rates: ${error.message}`,
        error
      );
    }
  }
  
  /**
   * Get recent tax updates since a specific date
   * @param {string} sinceDate - Date in YYYY-MM-DD format
   * @param {Array} jurisdictionIds - Optional array of jurisdiction IDs to filter by
   * @param {Array} taxTypes - Optional array of tax types to filter by
   * @returns {Object} Tax updates information
   */
  async getTaxUpdates(
    sinceDate,
    jurisdictionIds = [],
    taxTypes = []
  ) {
    try {
      // Build query conditions
      const conditions = ['tu.update_date >= ?'];
      const params = [sinceDate];
      
      // Add jurisdiction condition
      if (jurisdictionIds && jurisdictionIds.length > 0) {
        const placeholders = jurisdictionIds.map(() => '?').join(', ');
        conditions.push(`tr.jurisdiction_id IN (${placeholders})`);
        params.push(...jurisdictionIds);
      }
      
      // Add tax types condition
      if (taxTypes && taxTypes.length > 0) {
        const placeholders = taxTypes.map(() => '?').join(', ');
        conditions.push(`tr.tax_type IN (${placeholders})`);
        params.push(...taxTypes);
      }
      
      // Build the full query
      const query = `
        SELECT
          tu.update_id,
          tr.tax_id,
          tr.jurisdiction_id,
          j.jurisdiction_name,
          tu.update_type,
          tr.effective_date,
          tu.previous_rate,
          tr.rate AS new_rate,
          tu.documentation_url,
          tu.summary,
          tu.update_date
        FROM
          tax_updates tu
          JOIN tax_rates tr ON tu.tax_id = tr.tax_id
          JOIN jurisdictions j ON tr.jurisdiction_id = j.jurisdiction_id
        WHERE
          ${conditions.join(' AND ')}
        ORDER BY
          tu.update_date DESC
      `;
      
      const results = await dbQuery(query, params);
      
      // Process the results
      const updates = results.map(row => ({
        updateId: row.update_id,
        taxId: row.tax_id,
        jurisdictionId: row.jurisdiction_id,
        jurisdictionName: row.jurisdiction_name,
        updateType: row.update_type,
        effectiveDate: row.effective_date,
        previousRate: row.previous_rate,
        newRate: row.new_rate,
        documentationUrl: row.documentation_url,
        summary: row.summary,
        updateDate: row.update_date
      }));
      
      // Get the latest release version
      const versionQuery = `
        SELECT version, release_date
        FROM api_versions
        ORDER BY release_date DESC
        LIMIT 1
      `;
      
      const versionResults = await dbQuery(versionQuery);
      const releaseVersion = versionResults.length > 0 ? versionResults[0].version : 'unknown';
      const releaseDate = versionResults.length > 0 ? versionResults[0].release_date : null;
      
      return {
        updates,
        totalUpdates: updates.length,
        releaseVersion,
        releaseDate
      };
    } catch (error) {
      throw new TaxRateError(
        'tax_updates_error',
        `Failed to get tax updates: ${error.message}`,
        error
      );
    }
  }
  
  /**
   * Get the current Social Security wage base
   * @param {string} year - Optional year (defaults to current year)
   * @returns {number} Social Security wage base
   */
  getSocialSecurityWageBase(year = new Date().getFullYear()) {
    // This would typically come from a database, but using hard-coded values for example
    const wageBaseByYear = {
      2023: 160200,
      2024: 168600,
      2025: 176700 // Projected
    };
    
    return wageBaseByYear[year] || 176700; // Default to latest known/projected
  }
  
  /**
   * Map a database row to a tax rate object
   * @param {Object} row - Database row
   * @returns {Object} Tax rate object
   */
  _mapTaxRateRow(row) {
    return {
      taxId: row.tax_id,
      taxName: row.tax_name,
      taxType: row.tax_type,
      rate: row.rate,
      flatAmount: row.flat_amount,
      minimumWage: row.minimum_wage,
      maximumWage: row.maximum_wage,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      brackets: row.brackets
    };
  }
  
  /**
   * Get federal standard deduction for a given date
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Object} Standard deduction amounts by filing status
   */
  _getFederalStandardDeduction(effectiveDate) {
    // Extract the year from the effective date
    const year = parseInt(effectiveDate.slice(0, 4), 10);
    
    // This would come from a database in production
    // Using approximated values for illustration
    const standardDeductions = {
      2023: {
        single: 13850,
        married: 27700,
        headOfHousehold: 20800
      },
      2024: {
        single: 14600,
        married: 29200,
        headOfHousehold: 21900
      },
      2025: {
        single: 15400, // Projected
        married: 30800, // Projected
        headOfHousehold: 23000 // Projected
      }
    };
    
    return standardDeductions[year] || standardDeductions[2025];
  }
  
  /**
   * Get state-specific constants for tax calculations
   * @param {string} stateCode - Two-letter state code
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Object} State constants
   */
  async _getStateConstants(stateCode, effectiveDate) {
    try {
      // This would come from a database in production
      // Query for state constants
      const query = `
        SELECT
          constant_name,
          constant_value,
          effective_date
        FROM
          state_constants
        WHERE
          state_code = ?
          AND effective_date <= ?
          AND (expiration_date IS NULL OR expiration_date >= ?)
      `;
      
      const results = await dbQuery(query, [stateCode, effectiveDate, effectiveDate]);
      
      // Convert to object with name-value pairs
      const constants = {};
      for (const row of results) {
        constants[row.constant_name] = row.constant_value;
      }
      
      // Add default values for common constants if not present
      if (!constants.standardDeduction) {
        constants.standardDeduction = 0; // Default to 0 if not specified
      }
      
      return constants;
    } catch (error) {
      console.error(`Failed to get state constants for ${stateCode}:`, error);
      return {}; // Return empty object on error to avoid breaking calculations
    }
  }
  
  /**
   * Get additional employer taxes for a state
   * @param {string} stateCode - Two-letter state code
   * @param {string} effectiveDate - Date in YYYY-MM-DD format
   * @returns {Array} Additional employer taxes
   */
  async _getAdditionalEmployerTaxes(stateCode, effectiveDate) {
    try {
      // Get the jurisdiction ID for this state
      const jurisdictionQuery = `
        SELECT jurisdiction_id
        FROM jurisdictions
        WHERE jurisdiction_type = 'state' AND state_code = ?
      `;
      
      const jurisdictionResults = await dbQuery(jurisdictionQuery, [stateCode]);
      
      if (jurisdictionResults.length === 0) {
        return [];
      }
      
      const jurisdictionId = jurisdictionResults[0].jurisdiction_id;
      
      // Query for employer taxes
      const query = `
        SELECT 
          tax_id,
          tax_name,
          tax_type,
          rate,
          flat_amount,
          minimum_wage,
          maximum_wage,
          effective_date,
          expiration_date,
          brackets
        FROM 
          tax_rates
        WHERE 
          jurisdiction_id = ?
          AND tax_type LIKE 'employer_%'
          AND effective_date <= ?
          AND (expiration_date IS NULL OR expiration_date >= ?)
      `;
      
      const results = await dbQuery(query, [jurisdictionId, effectiveDate, effectiveDate]);
      
      // Process the results
      return results.map(row => {
        // If the tax has brackets, parse the JSON brackets field
        if (row.brackets) {
          row.brackets = JSON.parse(row.brackets);
        }
        
        return this._mapTaxRateRow(row);
      });
    } catch (error) {
      console.error(`Failed to get additional employer taxes for ${stateCode}:`, error);
      return []; // Return empty array on error
    }
  }
}

module.exports = new TaxRateService();
