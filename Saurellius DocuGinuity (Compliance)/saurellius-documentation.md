# Essential Documents for Saurellius Cloud Payroll & HR Management Platform

A detailed breakdown of the essential documents needed for compliance across all U.S. states and territories:

## Federal Employment and Tax Forms

### Core Employment Forms
1. **Form I-9** - Employment Eligibility Verification
   - Required for all new hires to verify identity and work authorization
   - Must be retained for 3 years after hire date or 1 year after employment ends
   - Required for all employers to verify the identity and employment authorization of individuals hired in the United States

2. **Form W-4** - Employee's Withholding Certificate 
   - Required for all employees to determine federal tax withholding
   - Should be updated when an employee has life changes (marriage, children, etc.)
   - Form W-4 is completed by employees and given to their employer so their employer can withhold the correct federal income tax from their pay

### Federal Tax Reporting Forms
1. **Form W-2** - Wage and Tax Statement
   - Annual statement of wages and taxes withheld for each employee
   - Employers must file a Form W-2 for each employee from whom Income, social security, or Medicare tax was withheld

2. **Form W-3** - Transmittal of Wage and Tax Statements
   - Summary form that accompanies W-2 forms sent to the Social Security Administration
   - Form W-3 summarizes information from Form W-2 and is not given to employees

3. **Form 941** - Employer's Quarterly Federal Tax Return
   - Quarterly reporting of federal income taxes, Social Security, and Medicare taxes
   - The Form 941 is the Employer's Quarterly Federal Tax Return for employers who withhold income taxes, social security tax, or Medicare tax

4. **Form 940** - Employer's Annual Federal Unemployment Tax Return
   - Annual reporting of Federal Unemployment Tax Act (FUTA) taxes
   - Form 940 is the Employer's Annual Federal Unemployment Tax Return

### Independent Contractor Forms
1. **Form W-9** - Request for Taxpayer Identification Number and Certification
   - Collected from contractors to obtain their TIN before issuing payments
   - It is recommended that you obtain a Form W-9 from any contractor you do business with

2. **Form 1099-NEC** - Nonemployee Compensation
   - For reporting payments of $600 or more to independent contractors
   - If you pay independent contractors, you may have to file Form 1099-NEC to report payments for services performed for your trade or business

3. **Form 1096** - Annual Summary and Transmittal of U.S. Information Returns
   - Summary form that accompanies paper 1099 forms sent to the IRS
   - If you file Forms 1099-NEC on paper you must submit them with Form 1096

## State-Specific Forms

### State Tax Withholding Forms
1. **State W-4 Equivalents** 
   - Many states have their own withholding forms distinct from the federal W-4
   - Our system must support all state-specific withholding forms
   - Most states update their W-4 forms annually. Visit your state's website to verify you are using the most up-to-date state W-4 form

2. **State Unemployment Insurance Forms**
   - Quarterly reports for each state where employees work
   - Contribution rates vary by state and employer experience
   - Quarterly SUI tax filings are the reports employers file on a quarterly basis with each state, district and territory

3. **State New Hire Reporting Forms**
   - Required for all new employees, including rehires
   - Some states also require reporting of independent contractors
   - In some states, this reporting is limited to W-2 employees, but in other states, this also includes independent contractors and freelancers

4. **State-Specific Independent Contractor Forms** 
   - Several states require special forms to report independent contractors
   - Examples include California's DE 542 and Massachusetts' contractor reporting requirements
   - Different states have reporting requirements for independent contractors such as California's DE 542

### Territory-Specific Forms
For U.S. territories (Puerto Rico, U.S. Virgin Islands, Guam, American Samoa, Northern Mariana Islands):
1. **Territory Tax Forms** - Each territory has its own tax forms and requirements
2. **Territory-Specific W-2 Forms** - Special W-2 variants including Form W-2PR, W-2VI, W-2GU, etc.
3. **Territory Employment Registration** - Special territory-specific employment registration requirements

## ACA Compliance Forms

1. **Form 1095-C** - Employer-Provided Health Insurance Offer and Coverage
   - Required for Applicable Large Employers (50+ FTEs) to report health coverage offered to employees
   - Certain employers send Form 1095-C to certain employees, with information about what coverage the employer offered

2. **Form 1094-C** - Transmittal of Employer-Provided Health Insurance Offer and Coverage
   - Summary form that accompanies Form 1095-C sent to the IRS
   - Forms 1094-C and 1095-C must be filed regardless of whether an ALE offers coverage or whether the employee enrolls in any coverage offered

3. **Form 1095-B** - Health Coverage
   - Statement from health insurance providers (including self-insured employers)
   - Health insurance providers send this form to individuals they cover, with information about who was covered and when

## Benefits and COBRA Documentation

1. **COBRA Election Forms**
   - Required notifications and election forms for employees who lose coverage
   - Reporting offers of COBRA continuation coverage and post-employment coverage is required in specific circumstances

2. **Benefits Enrollment Forms**
   - Standard forms for employees to elect benefits
   - Must include ACA-required information about coverage

3. **Summary Plan Descriptions (SPDs)**
   - Required ERISA documentation describing plan benefits
   - Must be provided to all plan participants

## Additional Compliance Documents

1. **Equal Employment Opportunity (EEO) Forms**
   - EEO-1 Report (for employers with 100+ employees)
   - Vets-4212 (for federal contractors)

2. **OSHA Reporting Forms**
   - OSHA Form 300 (Log of Work-Related Injuries and Illnesses)
   - OSHA Form 301 (Injury and Illness Incident Report)

3. **Foreign Worker Documentation**
   - Form W-8BEN for foreign contractors performing work outside the U.S.
   - If the independent contractor is not a US person and did not perform any of their services within the US, they will have to complete and file Form W-8BEN
   - Form 1042-S for payments to foreign individuals within the U.S.

## Implementation Recommendations

To ensure the Saurellius platform is fully compliant across all jurisdictions, we should:

1. **Maintain a dynamic form library** - Automatically updated when state/federal forms change
2. **Support online form completion** - Electronic signature support for all forms
3. **Implement smart form logic** - Only require forms relevant to specific employees and jurisdictions
4. **Automate filing schedules** - Calendar-based reminders and automated submission where possible
5. **Incorporate territory-specific logic** - Special handling for all U.S. territories
6. **Support multi-jurisdiction management** - For employees who work across state lines

This comprehensive document framework will ensure our Saurellius Cloud Payroll & HR Management platform maintains full compliance across all U.S. states and territories for both employees and independent contractors.