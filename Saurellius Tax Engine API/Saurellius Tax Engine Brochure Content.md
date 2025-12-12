# Saurellius Tax Engine Brochure Content

## The gold standard in gross-to-net calculations.

The **Saurellius Tax Engine (STE)®** is a powerful payroll processing and tax calculator perfect for building or enhancing a payroll platform, increasing compliance and accuracy, and eliminating manual processes.

### If there’s a tax, we calculate it.

The STE accounts for federal, state, and local taxes — both withholding and latent employer taxes — for over 7,400 taxing jurisdictions including all 50 states, Puerto Rico, and the U.S. Territories. Employer taxes and multi-state processing are accounted for as well.

| Employee Taxes | Employer Taxes | Local Taxes |
| :--- | :--- | :--- |
| FICA (Social Security & Medicare) | SDI/VDI | City |
| Federal withholding | Paid family & medical leave | County |
| Benefits and pre-tax benefit rules, down to the local tax | Employee SUI | School district |
| Courtesy withholding | Various other employer taxes | Municipality |
| Earned income taxes | FUTA & SUTA | Privilege taxes |
| | | Local services taxes |
| | | JEDDs/JEDZ |

### The most powerful payroll tax engine on the market. Also available in a Canadian version

*   Runs at an average of 3 milliseconds per calculation with over 7,400 taxes, each with its own unique tax ID.
*   Performs over 100,000 gross-to-net-calculations in 5 minutes on a Xeon Server.
*   Covers multi-state calculations while also using cutting-edge geocoding technology to determine accurate payroll taxes for work and home addresses to rooftop precision.
*   Normalizes addresses while reciprocity and nexus settings are applied.
*   Does not store any personal data or personally identifiable information. All input data is validated as a protective measure.
*   API communications are also encrypted in-transit and an API Key is utilized for authorization.
*   All STE customers also receive the **Saurellius Tax Notification Service** which includes real-time updates when a payroll tax changes, supporting documentation from primary sources, tax-effective dates, and the version of the STE in which the new or updated tax is available.

---

## The nuts and bolts.

### Web API (recommended)

The **Saurellius Tax Engine** introduces more flexibility for implementation as well as additional features, including options for a web-hosted API or on-premise SDK.

*   Hosted on Amazon Web Services (AWS) by **Saurellius Software**.
*   Automatic load balancing through AWS to achieve service redundancy and resiliency.
*   Your application interacts with the STE through Web API endpoints.
*   Endpoints are accessible via HTTPS requests.
*   Supports JSON and XML web API request/response data formats.
*   Application updates and quality assurance testing are performed by **Saurellius Software**.
*   Application updates released monthly, with interim releases as taxes change.
*   Customers have access to a staging environment to preview updates prior to production releases.

#### Location Code Service

The STE uses location codes to calculate taxes based on an employee’s home and work address. They consist of three parts:

1.  State number
2.  County number
3.  Feature ID (city, municipality, township, etc.)

Location codes never change and are based on the Geographic Names Information System (GNIS), the federal standard for geographic nomenclature.

### On-Premise Software Development Kit (SDK)

*   Installed in your environment by your technical team.
*   Updates and testing performed by your technical team.
*   Monthly updates require download and installation on your servers to stay up to date with the latest tax rates.
*   Interim releases from **Saurellius Software** as necessary during parts of the year when taxes change more frequently.

### Interfaces

The STE contains seven different interfaces to suit your development preferences.

| On-Premise SDK | Web API |
| :--- | :--- |
| Windows 32-Bit | JSON |
| Windows 64-Bit | XML |
| Linux 64-Bit | C/C++ |
| .NET | JAVA |
| .NET Core | Delphi |

Clients include: [Clients list was not fully extracted or was a graphic]

To deliver great payroll, you need powerful technology. Let’s be great together.

[saurellius.com](http://saurellius.com) Saurellius@drpaystub.com
