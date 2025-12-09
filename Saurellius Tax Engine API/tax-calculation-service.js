// services/taxCalculationService.js - Core tax calculation logic

const { v4: uuidv4 } = require('uuid');
const taxRateService = require('./taxRateService');
const locationService = require('./locationService');
const employeeService = require('./employeeService');
const reciprocityService = require('./reciprocityService');
const taxFormulasService = require('./taxFormulasService');
const { TaxCalculationError } = require('../utils/errors');
const { logCalculation } = require('../utils/logging');

/**
 * Central tax calculation service for the Saurellius Tax Engine
 */
class TaxCalculationService {
  /**
   * Perform a complete gross-to-net tax calculation for an employee
   * @param {Object} employeeData - Employee information and earnings data
   * @returns {Object} Complete tax calculation results
   */
  async calculateTaxes(employeeData) {
    try {
      const calculationId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Validate the input data
      this._validateInput(employeeData);
      
      // Normalize addresses and get tax jurisdiction information
      const { employee, workLocationInfo, homeLocationInfo } = await this._prepareLocations(employeeData);
      
      // Calculate federal taxes
      const federalTaxes = await this._calculateFederalTaxes(employee, employeeData);
      
      // Calculate state taxes
      const stateTaxes = await this._calculateStateTaxes(
        employee, 
        employeeData, 
        workLocationInfo,
        homeLocationInfo
      );
      
      // Calculate local taxes
      const localTaxes = await this._calculateLocalTaxes(
        employee, 
        employeeData,
        workLocationInfo,
        homeLocationInfo
      );
      
      // Calculate employer taxes
      const employerTaxes = await this._calculateEmployerTaxes(
        employee,
        employeeData,
        workLocationInfo,
        homeLocationInfo
      );
      
      // Calculate net pay
      const grossPay = this._calculateGrossPay(employeeData.earnings);
      const preTaxDeductions = this._sumPreTaxDeductions(employeeData.preTaxDeductions || {});
      const taxableIncome = grossPay - preTaxDeductions;
      
      const totalTaxes = this._calculateTotalTaxes(federalTaxes, stateTaxes, localTaxes);
      const postTaxDeductions = this._sumPostTaxDeductions(employeeData.postTaxDeductions || {});
      
      const netPay = taxableIncome - totalTaxes - postTaxDeductions;
      
      // Build the response
      const result = {
        calculationId,
        timestamp,
        taxes: {
          federal: federalTaxes,
          state: stateTaxes,
          local: localTaxes,
          employer: employerTaxes
        },
        netPay: parseFloat(netPay.toFixed(2)),
        totalTaxes: parseFloat(totalTaxes.toFixed(2)),
        grossToNetSummary: {
          grossPay: parseFloat(grossPay.toFixed(2)),
          preTaxDeductions: parseFloat(preTaxDeductions.toFixed(2)),
          taxableIncome: parseFloat(taxableIncome.toFixed(2)),
          taxes: parseFloat(totalTaxes.toFixed(2)),
          postTaxDeductions: parseFloat(postTaxDeductions.toFixed(2)),
          netPay: parseFloat(netPay.toFixed(2))
        }
      };
      
      // Log the calculation for analytics and debugging
      logCalculation(calculationId, employeeData, result);
      
      return result;
    } catch (error) {
      if (error instanceof TaxCalculationError) {
        throw error;
      } else {
        throw new TaxCalculationError('Failed to calculate taxes', error.message, error);
      }
    }
  }
  
  /**
   * Perform tax calculations for multiple employees in a batch
   * @param {Object} batchData - Batch of employee data and common pay period info
   * @returns {Array} Array of tax calculation results
   */
  async calculateBatchTaxes(batchData) {
    try {
      const { payPeriod, employees } = batchData;
      
      // Process each employee in parallel
      const results = await Promise.all(
        employees.map(async (employee) => {
          // Combine employee data with common pay period
          const employeeData = { 
            ...employee, 
            payPeriod 
          };
          
          try {
            return await this.calculateTaxes(employeeData);
          } catch (error) {
            // Include error information in the results
            return {
              employeeId: employee.id || 'unknown',
              error: {
                code: error.code || 'calculation_error',
                message: error.message,
                details: error.details
              }
            };
          }
        })
      );
      
      return {
        batchId: uuidv4(),
        timestamp: new Date().toISOString(),
        totalEmployees: employees.length,
        results
      };
    } catch (error) {
      throw new TaxCalculationError('Failed to process batch calculation', error.message, error);
    }
  }
  
  /**
   * Calculate taxes for an employee who works in multiple states
   * @param {Object} multistateData - Employee data with multiple work locations
   * @returns {Object} Tax calculation results split by state
   */
  async calculateMultistateTaxes(multistateData) {
    try {
      const { employee, payPeriod, earnings, workLocations, preTaxDeductions, postTaxDeductions } = multistateData;
      
      // Validate the employee has a home address
      if (!employee.homeAddress) {
        throw new TaxCalculationError(
          'Missing home address',
          'Employee home address is required for multistate calculations'
        );
      }
      
      // Get home location information
      const homeLocationInfo = await locationService.validateLocation(employee.homeAddress);
      
      // Process each work location
      const locationResults = await Promise.all(
        workLocations.map(async (location) => {
          // Get work location information
          const workLocationInfo = await locationService.validateLocation(location.workAddress);
          
          // Check for reciprocity between states
          const reciprocity = await reciprocityService.getReciprocityRules(
            homeLocationInfo.state,
            workLocationInfo.state
          );
          
          // Create a simplified employee record for this location
          const locationEmployee = {
            ...employee,
            workAddress: location.workAddress
          };
          
          // Create earnings proportional to this location
          const locationEarnings = {
            regularEarnings: location.earningsForLocation,
            overtimeEarnings: 0,
            bonusEarnings: 0,
            commissionEarnings: 0,
            otherEarnings: 0
          };
          
          // Calculate state and local taxes for this location
          const stateTaxes = await this._calculateStateTaxes(
            locationEmployee,
            { earnings: locationEarnings, payPeriod },
            workLocationInfo,
            homeLocationInfo,
            reciprocity
          );
          
          const localTaxes = await this._calculateLocalTaxes(
            locationEmployee,
            { earnings: locationEarnings, payPeriod },
            workLocationInfo,
            homeLocationInfo,
            reciprocity
          );
          
          return {
            state: workLocationInfo.state,
            stateWithholding: stateTaxes.stateIncomeTax || 0,
            localWithholding: this._sumLocalTaxes(localTaxes),
            sdiFees: stateTaxes.stateDisabilityInsurance || 0,
            otherStateTaxes: (stateTaxes.paidFamilyLeave || 0) + (stateTaxes.additionalStateTaxes || 0),
            daysWorked: location.daysWorked,
            percentageOfTime: location.percentageOfTime,
            earningsForLocation: location.earningsForLocation,
            reciprocityApplied: reciprocity.hasReciprocityAgreement
          };
        })
      );
      
      // Calculate federal taxes based on total earnings
      const federalTaxes = await this._calculateFederalTaxes(
        employee,
        { 
          earnings,
          payPeriod,
          preTaxDeductions,
          federalWithholding: multistateData.federalWithholding
        }
      );
      
      // Build reciprocity information
      const reciprocityRules = await Promise.all(
        workLocations.map(async (location) => {
          const homeState = homeLocationInfo.state;
          const workState = location.state;
          
          if (homeState === workState) {
            return null; // No reciprocity needed for same state
          }
          
          const reciprocity = await reciprocityService.getReciprocityRules(homeState, workState);
          
          if (!reciprocity.hasReciprocityAgreement) {
            return null; // No reciprocity agreement
          }
          
          return {
            homeState,
            workState,
            reciprocityRule: reciprocity.details,
            impact: 'Tax withheld for home state instead of work state'
          };
        })
      );
      
      // Filter out null values
      const filteredReciprocityRules = reciprocityRules.filter(rule => rule !== null);
      
      // Calculate total state withholding across all locations
      const totalStateWithholding = locationResults.reduce(
        (sum, location) => sum + location.stateWithholding,
        0
      );
      
      // Calculate total local withholding across all locations
      const totalLocalWithholding = locationResults.reduce(
        (sum, location) => sum + location.localWithholding,
        0
      );
      
      // Calculate net pay
      const grossPay = earnings.totalEarnings;
      const preTaxTotal = preTaxDeductions?.total || 0;
      const postTaxTotal = postTaxDeductions?.total || 0;
      
      const federalTaxTotal = federalTaxes.federalIncomeTax + 
                             federalTaxes.socialSecurity + 
                             federalTaxes.medicare + 
                             (federalTaxes.additionalMedicare || 0);
      
      const netPay = grossPay - 
                    preTaxTotal - 
                    federalTaxTotal - 
                    totalStateWithholding - 
                    totalLocalWithholding - 
                    postTaxTotal;
      
      // Build the final result
      return {
        calculationId: uuidv4(),
        timestamp: new Date().toISOString(),
        taxesByState: locationResults,
        federalTaxes: federalTaxes,
        netPay: parseFloat(netPay.toFixed(2)),
        reciprocityRulesApplied: filteredReciprocityRules
      };
    } catch (error) {
      throw new TaxCalculationError('Failed to calculate multistate taxes', error.message, error);
    }
  }
  
  /**
   * Validate input data for completeness and correctness
   * @param {Object} employeeData - Employee and earnings data
   * @throws {TaxCalculationError} If validation fails
   */
  _validateInput(employeeData) {
    // Check for required fields
    if (!employeeData.employee) {
      throw new TaxCalculationError('Missing employee data', 'Employee information is required');
    }
    
    if (!employeeData.payPeriod) {
      throw new TaxCalculationError('Missing pay period', 'Pay period information is required');
    }
    
    if (!employeeData.earnings) {
      throw new TaxCalculationError('Missing earnings data', 'Earnings information is required');
    }
    
    // Validate employee has either address or location code
    const employee = employeeData.employee;
    if (!employee.homeAddress && !employee.homeLocationCode) {
      throw new TaxCalculationError(
        'Missing home location',
        'Either home address or home location code is required'
      );
    }
    
    if (!employee.workAddress && !employee.workLocationCode) {
      throw new TaxCalculationError(
        'Missing work location',
        'Either work address or work location code is required'
      );
    }
    
    // Validate pay period
    const payPeriod = employeeData.payPeriod;
    if (!payPeriod.startDate || !payPeriod.endDate || !payPeriod.payDate || !payPeriod.periodType) {
      throw new TaxCalculationError(
        'Invalid pay period',
        'Pay period must include startDate, endDate, payDate, and periodType'
      );
    }
    
    // Additional validations can be added here
  }
  
  /**
   * Prepare location information for tax calculations
   * @param {Object} employeeData - Employee data
   * @returns {Object} Prepared employee and location information
   */
  async _prepareLocations(employeeData) {
    const employee = employeeData.employee;
    
    // Get work location information
    let workLocationInfo;
    if (employee.workLocationCode) {
      workLocationInfo = await locationService.getLocationByCode(employee.workLocationCode);
    } else {
      workLocationInfo = await locationService.validateLocation(employee.workAddress);
    }
    
    // Get home location information
    let homeLocationInfo;
    if (employee.homeLocationCode) {
      homeLocationInfo = await locationService.getLocationByCode(employee.homeLocationCode);
    } else {
      homeLocationInfo = await locationService.validateLocation(employee.homeAddress);
    }
    
    return {
      employee,
      workLocationInfo,
      homeLocationInfo
    };
  }
  
  /**
   * Calculate federal taxes for an employee
   * @param {Object} employee - Employee information
   * @param {Object} employeeData - Complete employee data including earnings
   * @returns {Object} Federal tax calculations
   */
  async _calculateFederalTaxes(employee, employeeData) {
    const { earnings, payPeriod, preTaxDeductions = {}, federalWithholding = {} } = employeeData;
    
    // Calculate gross pay
    const grossPay = this._calculateGrossPay(earnings);
    
    // Calculate pre-tax deductions total
    const preTaxTotal = this._sumPreTaxDeductions(preTaxDeductions);
    
    // Calculate taxable income for federal purposes
    const federalTaxableIncome = grossPay - preTaxTotal;
    
    // Get the federal tax formulas
    const federalTaxFormulas = await taxFormulasService.getFederalTaxFormulas(payPeriod.periodType);
    
    // Calculate federal income tax
    const federalIncomeTax = taxFormulasService.calculateFederalIncomeTax(
      federalTaxableIncome,
      federalWithholding.filingStatus || 'single',
      federalWithholding.allowances || 0,
      federalWithholding.additionalWithholding || 0,
      federalWithholding.nonResidentAlien || false,
      payPeriod.periodType,
      federalTaxFormulas
    );
    
    // Calculate Social Security
    const socialSecurityWage = this._calculateSocialSecurityWage(federalTaxableIncome, employee);
    const socialSecurity = taxFormulasService.calculateSocialSecurity(socialSecurityWage);
    
    // Calculate Medicare
    const medicareWage = this._calculateMedicareWage(federalTaxableIncome, employee);
    const medicare = taxFormulasService.calculateMedicare(medicareWage);
    
    // Calculate Additional Medicare if applicable
    let additionalMedicare = 0;
    if (medicareWage > federalTaxFormulas.additionalMedicareThreshold) {
      additionalMedicare = taxFormulasService.calculateAdditionalMedicare(
        medicareWage, 
        federalTaxFormulas.additionalMedicareThreshold
      );
    }
    
    return {
      federalIncomeTax: parseFloat(federalIncomeTax.toFixed(2)),
      socialSecurity: parseFloat(socialSecurity.toFixed(2)),
      medicare: parseFloat(medicare.toFixed(2)),
      additionalMedicare: parseFloat(additionalMedicare.toFixed(2))
    };
  }
  
  /**
   * Calculate state taxes for an employee
   * @param {Object} employee - Employee information
   * @param {Object} employeeData - Complete employee data
   * @param {Object} workLocationInfo - Work location details
   * @param {Object} homeLocationInfo - Home location details
   * @param {Object} reciprocity - Optional reciprocity rules
   * @returns {Object} State tax calculations
   */
  async _calculateStateTaxes(
    employee,
    employeeData,
    workLocationInfo,
    homeLocationInfo,
    reciprocity = null
  ) {
    const { earnings, payPeriod, preTaxDeductions = {}, stateWithholding = {} } = employeeData;
    
    // Check if we need to get reciprocity information
    if (!reciprocity && workLocationInfo.state !== homeLocationInfo.state) {
      reciprocity = await reciprocityService.getReciprocityRules(
        homeLocationInfo.state,
        workLocationInfo.state
      );
    }
    
    // Determine which state to withhold for based on reciprocity
    let withholdingState = workLocationInfo.state;
    if (reciprocity && reciprocity.hasReciprocityAgreement) {
      withholdingState = homeLocationInfo.state;
    }
    
    // Get state tax rates and formulas
    const stateTaxFormulas = await taxFormulasService.getStateTaxFormulas(
      withholdingState,
      payPeriod.periodType
    );
    
    // Calculate gross pay
    const grossPay = this._calculateGrossPay(earnings);
    
    // Calculate pre-tax deductions total
    const preTaxTotal = this._sumPreTaxDeductions(preTaxDeductions);
    
    // Calculate taxable income for state purposes
    // Note: Different states have different rules for taxable income
    const stateTaxableIncome = taxFormulasService.calculateStateTaxableIncome(
      grossPay,
      preTaxTotal,
      withholdingState,
      stateTaxFormulas
    );
    
    // Calculate state income tax
    const stateIncomeTax = taxFormulasService.calculateStateIncomeTax(
      stateTaxableIncome,
      stateWithholding.filingStatus || 'single',
      stateWithholding.allowances || 0,
      stateWithholding.additionalWithholding || 0,
      withholdingState,
      payPeriod.periodType,
      stateTaxFormulas
    );
    
    // Calculate state disability insurance if applicable
    const stateDisabilityInsurance = stateTaxFormulas.hasSDI
      ? taxFormulasService.calculateStateDisabilityInsurance(
          grossPay,
          withholdingState,
          stateTaxFormulas
        )
      : 0;
    
    // Calculate state unemployment insurance if applicable
    const stateSUI = stateTaxFormulas.hasEmployeeSUI
      ? taxFormulasService.calculateStateSUI(
          grossPay,
          withholdingState,
          stateTaxFormulas
        )
      : 0;
    
    // Calculate paid family leave contributions if applicable
    const paidFamilyLeave = stateTaxFormulas.hasPaidFamilyLeave
      ? taxFormulasService.calculatePaidFamilyLeave(
          grossPay,
          withholdingState,
          stateTaxFormulas
        )
      : 0;
    
    // Return state tax results
    return {
      stateCode: withholdingState,
      stateIncomeTax: parseFloat(stateIncomeTax.toFixed(2)),
      stateDisabilityInsurance: parseFloat(stateDisabilityInsurance.toFixed(2)),
      stateSUI: parseFloat(stateSUI.toFixed(2)),
      paidFamilyLeave: parseFloat(paidFamilyLeave.toFixed(2))
    };
  }
  
  /**
   * Calculate local taxes for an employee
   * @param {Object} employee - Employee information
   * @param {Object} employeeData - Complete employee data
   * @param {Object} workLocationInfo - Work location details
   * @param {Object} homeLocationInfo - Home location details
   * @param {Object} reciprocity - Optional reciprocity rules
   * @returns {Array} Local tax calculations
   */
  async _calculateLocalTaxes(
    employee,
    employeeData,
    workLocationInfo,
    homeLocationInfo,
    reciprocity = null
  ) {
    const { earnings, payPeriod } = employeeData;
    
    // Calculate gross pay
    const grossPay = this._calculateGrossPay(earnings);
    
    // Get applicable local jurisdictions
    const workLocalJurisdictions = workLocationInfo.taxJurisdictions.filter(
      j => j.jurisdictionType !== 'state'
    );
    
    const homeLocalJurisdictions = homeLocationInfo.taxJurisdictions.filter(
      j => j.jurisdictionType !== 'state'
    );
    
    // Determine which local jurisdictions to apply based on location and reciprocity
    let applicableJurisdictions = [...workLocalJurisdictions];
    
    // Some local taxes apply based on residence regardless of work location
    const residenceBasedJurisdictions = homeLocalJurisdictions.filter(
      j => j.residenceBased === true
    );
    
    // Add residence-based jurisdictions that aren't already included
    residenceBasedJurisdictions.forEach(rj => {
      if (!applicableJurisdictions.some(aj => aj.jurisdictionId === rj.jurisdictionId)) {
        applicableJurisdictions.push(rj);
      }
    });
    
    // Calculate each local tax
    const localTaxes = await Promise.all(
      applicableJurisdictions.map(async jurisdiction => {
        // Get tax rates for this jurisdiction
        const jurisdictionTaxes = await taxRateService.getLocalTaxRates(
          jurisdiction.jurisdictionId,
          payPeriod.payDate
        );
        
        // Calculate each tax in this jurisdiction
        const taxResults = {};
        
        for (const tax of jurisdictionTaxes) {
          // Skip taxes that don't apply to this employee
          if (!this._taxApplies(tax, employee, grossPay)) {
            continue;
          }
          
          // Calculate the tax amount
          const taxAmount = taxFormulasService.calculateLocalTax(
            grossPay,
            tax,
            jurisdiction,
            payPeriod.periodType
          );
          
          // Add to results if non-zero
          if (taxAmount > 0) {
            taxResults[tax.taxType] = parseFloat(taxAmount.toFixed(2));
          }
        }
        
        // Only include jurisdictions with at least one tax
        if (Object.keys(taxResults).length === 0) {
          return null;
        }
        
        // Build the local tax result
        return {
          localityName: jurisdiction.jurisdictionName,
          localityType: jurisdiction.jurisdictionType,
          localityCode: jurisdiction.jurisdictionCode,
          ...taxResults
        };
      })
    );
    
    // Filter out null results
    return localTaxes.filter(tax => tax !== null);
  }
  
  /**
   * Calculate employer taxes
   * @param {Object} employee - Employee information
   * @param {Object} employeeData - Complete employee data
   * @param {Object} workLocationInfo - Work location details
   * @param {Object} homeLocationInfo - Home location details
   * @returns {Object} Employer tax calculations
   */
  async _calculateEmployerTaxes(
    employee,
    employeeData,
    workLocationInfo,
    homeLocationInfo
  ) {
    const { earnings, payPeriod } = employeeData;
    
    // Calculate gross pay
    const grossPay = this._calculateGrossPay(earnings);
    
    // Get federal employer tax formulas
    const federalTaxFormulas = await taxFormulasService.getFederalTaxFormulas(payPeriod.periodType);
    
    // Calculate federal unemployment tax (FUTA)
    const futa = taxFormulasService.calculateFUTA(
      grossPay,
      workLocationInfo.state,
      federalTaxFormulas
    );
    
    // Get state employer tax formulas
    const stateTaxFormulas = await taxFormulasService.getStateTaxFormulas(
      workLocationInfo.state,
      payPeriod.periodType
    );
    
    // Calculate state unemployment insurance (SUTA)
    const suta = taxFormulasService.calculateSUTA(
      grossPay,
      workLocationInfo.state,
      stateTaxFormulas
    );
    
    // Calculate employer portion of Social Security
    const socialSecurityWage = this._calculateSocialSecurityWage(grossPay, employee);
    const employerSocialSecurity = taxFormulasService.calculateSocialSecurity(socialSecurityWage);
    
    // Calculate employer portion of Medicare
    const medicareWage = this._calculateMedicareWage(grossPay, employee);
    const employerMedicare = taxFormulasService.calculateMedicare(medicareWage);
    
    // Calculate other state-specific employer taxes
    const otherEmployerTaxes = await this._calculateOtherEmployerTaxes(
      grossPay,
      workLocationInfo,
      stateTaxFormulas
    );
    
    return {
      federalUnemployment: parseFloat(futa.toFixed(2)),
      stateUnemployment: parseFloat(suta.toFixed(2)),
      employerSocialSecurity: parseFloat(employerSocialSecurity.toFixed(2)),
      employerMedicare: parseFloat(employerMedicare.toFixed(2)),
      otherEmployerTaxes: parseFloat(otherEmployerTaxes.toFixed(2))
    };
  }
  
  /**
   * Calculate other employer taxes based on state requirements
   * @param {number} grossPay - Gross pay amount
   * @param {Object} workLocationInfo - Work location details
   * @param {Object} stateTaxFormulas - State tax formulas
   * @returns {number} Total of other employer taxes
   */
  async _calculateOtherEmployerTaxes(grossPay, workLocationInfo, stateTaxFormulas) {
    let totalOtherTaxes = 0;
    
    // Check for additional employer taxes based on state
    if (stateTaxFormulas.additionalEmployerTaxes) {
      for (const tax of stateTaxFormulas.additionalEmployerTaxes) {
        const taxAmount = taxFormulasService.calculateAdditionalEmployerTax(
          grossPay,
          tax,
          workLocationInfo.state
        );
        
        totalOtherTaxes += taxAmount;
      }
    }
    
    return totalOtherTaxes;
  }
  
  /**
   * Check if a tax applies to an employee
   * @param {Object} tax - Tax definition
   * @param {Object} employee - Employee information
   * @param {number} grossPay - Gross pay amount
   * @returns {boolean} Whether the tax applies
   */
  _taxApplies(tax, employee, grossPay) {
    // Check minimum wage threshold
    if (tax.minimumWage && grossPay < tax.minimumWage) {
      return false;
    }
    
    // Check maximum wage threshold
    if (tax.maximumWage && grossPay > tax.maximumWage) {
      return false;
    }
    
    // Additional eligibility checks can be added here
    
    return true;
  }
  
  /**
   * Calculate total gross pay from earnings object
   * @param {Object} earnings - Earnings breakdown
   * @returns {number} Total gross pay
   */
  _calculateGrossPay(earnings) {
    // If totalEarnings is provided, use that
    if (earnings.totalEarnings) {
      return earnings.totalEarnings;
    }
    
    // Otherwise sum up the components
    return (
      (earnings.regularEarnings || 0) +
      (earnings.overtimeEarnings || 0) +
      (earnings.bonusEarnings || 0) +
      (earnings.commissionEarnings || 0) +
      (earnings.otherEarnings || 0)
    );
  }
  
  /**
   * Sum up pre-tax deductions
   * @param {Object} preTaxDeductions - Pre-tax deductions object
   * @returns {number} Total pre-tax deductions
   */
  _sumPreTaxDeductions(preTaxDeductions) {
    // If total is provided, use that
    if (preTaxDeductions.total) {
      return preTaxDeductions.total;
    }
    
    // Otherwise sum up the components
    return (
      (preTaxDeductions.retirement401k || 0) +
      (preTaxDeductions.medical || 0) +
      (preTaxDeductions.dental || 0) +
      (preTaxDeductions.vision || 0) +
      (preTaxDeductions.hsa || 0) +
      (preTaxDeductions.fsa || 0) +
      (preTaxDeductions.otherPreTaxDeductions || 0)
    );
  }
  
  /**
   * Sum up post-tax deductions
   * @param {Object} postTaxDeductions - Post-tax deductions object
   * @returns {number} Total post-tax deductions
   */
  _sumPostTaxDeductions(postTaxDeductions) {
    // If total is provided, use that
    if (postTaxDeductions.total) {
      return postTaxDeductions.total;
    }
    
    // Otherwise sum up the components
    return (
      (postTaxDeductions.garnishments || 0) +
      (postTaxDeductions.otherPostTaxDeductions || 0)
    );
  }
  
  /**
   * Calculate total taxes from federal, state, and local taxes
   * @param {Object} federalTaxes - Federal tax calculations
   * @param {Object} stateTaxes - State tax calculations
   * @param {Array} localTaxes - Local tax calculations
   * @returns {number} Total taxes
   */
  _calculateTotalTaxes(federalTaxes, stateTaxes, localTaxes) {
    // Sum federal taxes
    const federalTotal = 
      federalTaxes.federalIncomeTax +
      federalTaxes.socialSecurity +
      federalTaxes.medicare +
      (federalTaxes.additionalMedicare || 0);
    
    // Sum state taxes
    const stateTotal = 
      (stateTaxes.stateIncomeTax || 0) +
      (stateTaxes.stateDisabilityInsurance || 0) +
      (stateTaxes.stateSUI || 0) +
      (stateTaxes.paidFamilyLeave || 0);
    
    // Sum local taxes
    const localTotal = this._sumLocalTaxes(localTaxes);
    
    return federalTotal + stateTotal + localTotal;
  }
  
  /**
   * Sum all local taxes
   * @param {Array} localTaxes - Array of local tax objects
   * @returns {number} Total local taxes
   */
  _sumLocalTaxes(localTaxes) {
    return localTaxes.reduce((total, locality) => {
      // Sum all tax values in this locality (excluding metadata fields)
      const localityTotal = Object.entries(locality).reduce((sum, [key, value]) => {
        if (
          key !== 'localityName' &&
          key !== 'localityType' &&
          key !== 'localityCode' &&
          typeof value === 'number'
        ) {
          return sum + value;
        }
        return sum;
      }, 0);
      
      return total + localityTotal;
    }, 0);
  }
  
  /**
   * Calculate wage subject to Social Security tax
   * @param {number} wage - Gross wage
   * @param {Object} employee - Employee information
   * @returns {number} Wage subject to Social Security
   */
  _calculateSocialSecurityWage(wage, employee) {
    // Check for year-to-date wages to handle annual limit
    // This would typically come from payroll history
    const ytdSocialSecurityWages = employee.ytdSocialSecurityWages || 0;
    
    // Get the current year's Social Security wage base
    const currentYearWageBase = taxRateService.getSocialSecurityWageBase();
    
    // If YTD wages already exceed the wage base, no more Social Security tax
    if (ytdSocialSecurityWages >= currentYearWageBase) {
      return 0;
    }
    
    // If YTD wages plus current wages exceed the wage base, only tax up to the limit
    if (ytdSocialSecurityWages + wage > currentYearWageBase) {
      return currentYearWageBase - ytdSocialSecurityWages;
    }
    
    // Otherwise, tax the full wage
    return wage;
  }
  
  /**
   * Calculate wage subject to Medicare tax
   * @param {number} wage - Gross wage
   * @param {Object} employee - Employee information
   * @returns {number} Wage subject to Medicare
   */
  _calculateMedicareWage(wage, employee) {
    // Medicare has no wage base limit, so return the full wage
    return wage;
  }
}

module.exports = new TaxCalculationService();
    