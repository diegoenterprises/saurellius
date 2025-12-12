"""
SAURELLIUS CONTRACTOR/1099 SERVICE
Independent contractor management, payments, and 1099 generation
"""

from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid
import hashlib


class ContractorType(Enum):
    INDIVIDUAL = "individual"
    SOLE_PROPRIETOR = "sole_proprietor"
    LLC_SINGLE = "llc_single_member"
    LLC_MULTI = "llc_multi_member"
    PARTNERSHIP = "partnership"
    C_CORP = "c_corporation"
    S_CORP = "s_corporation"


class PaymentMethod(Enum):
    CHECK = "check"
    DIRECT_DEPOSIT = "direct_deposit"
    WIRE = "wire_transfer"
    PAYPAL = "paypal"
    VENMO = "venmo"
    ZELLE = "zelle"


class Form1099Type(Enum):
    NEC = "1099-NEC"  # Non-Employee Compensation (most common)
    MISC = "1099-MISC"  # Miscellaneous Income
    K = "1099-K"  # Payment Card Transactions


class SaurelliusContractors:
    """Complete contractor management system with 1099 generation"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.contractors: Dict[str, dict] = {}
        self.payments: List[dict] = []
        self.forms_1099: List[dict] = []
        
        # IRS thresholds
        self.THRESHOLD_1099_NEC = Decimal("600.00")
        self.THRESHOLD_1099_MISC = Decimal("600.00")
        self.BACKUP_WITHHOLDING_RATE = Decimal("0.24")  # 24% if no W-9
    
    def create_contractor(self, data: dict) -> dict:
        """Create a new contractor profile"""
        contractor_id = str(uuid.uuid4())
        
        contractor = {
            "id": contractor_id,
            "company_id": self.company_id,
            
            # Basic Info
            "contractor_type": data.get("contractor_type", ContractorType.INDIVIDUAL.value),
            "business_name": data.get("business_name"),
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "email": data["email"],
            "phone": data.get("phone"),
            
            # Address
            "address": {
                "street1": data.get("street1", ""),
                "street2": data.get("street2", ""),
                "city": data.get("city", ""),
                "state": data.get("state", ""),
                "zip": data.get("zip", ""),
                "country": data.get("country", "US")
            },
            
            # Tax Info
            "tax_id_type": data.get("tax_id_type", "ssn"),  # ssn or ein
            "tax_id_last4": data.get("tax_id", "")[-4:] if data.get("tax_id") else "",
            "tax_id_hash": self._hash_tax_id(data.get("tax_id", "")),
            "w9_on_file": data.get("w9_on_file", False),
            "w9_received_date": data.get("w9_received_date"),
            "backup_withholding": not data.get("w9_on_file", False),
            
            # Payment Info
            "payment_method": data.get("payment_method", PaymentMethod.CHECK.value),
            "bank_info": self._encrypt_bank_info(data.get("bank_info", {})),
            "default_rate": Decimal(str(data.get("default_rate", 0))),
            "rate_type": data.get("rate_type", "hourly"),  # hourly, project, daily
            
            # Status
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            
            # YTD Totals
            "ytd_payments": Decimal("0.00"),
            "ytd_backup_withholding": Decimal("0.00")
        }
        
        self.contractors[contractor_id] = contractor
        return self._sanitize_contractor(contractor)
    
    def _hash_tax_id(self, tax_id: str) -> str:
        """Hash tax ID for secure storage"""
        if not tax_id:
            return ""
        return hashlib.sha256(tax_id.encode()).hexdigest()
    
    def _encrypt_bank_info(self, bank_info: dict) -> dict:
        """Encrypt sensitive bank information"""
        if not bank_info:
            return {}
        return {
            "bank_name": bank_info.get("bank_name", ""),
            "account_type": bank_info.get("account_type", "checking"),
            "routing_last4": bank_info.get("routing_number", "")[-4:] if bank_info.get("routing_number") else "",
            "account_last4": bank_info.get("account_number", "")[-4:] if bank_info.get("account_number") else "",
            "is_verified": bank_info.get("is_verified", False)
        }
    
    def _sanitize_contractor(self, contractor: dict) -> dict:
        """Remove sensitive data from contractor for API response"""
        safe = contractor.copy()
        safe.pop("tax_id_hash", None)
        safe["ytd_payments"] = float(safe.get("ytd_payments", 0))
        safe["ytd_backup_withholding"] = float(safe.get("ytd_backup_withholding", 0))
        safe["default_rate"] = float(safe.get("default_rate", 0))
        return safe
    
    def get_contractor(self, contractor_id: str) -> Optional[dict]:
        """Get contractor by ID"""
        contractor = self.contractors.get(contractor_id)
        if contractor:
            return self._sanitize_contractor(contractor)
        return None
    
    def get_all_contractors(self, status: Optional[str] = None) -> List[dict]:
        """Get all contractors, optionally filtered by status"""
        contractors = list(self.contractors.values())
        if status:
            contractors = [c for c in contractors if c["status"] == status]
        return [self._sanitize_contractor(c) for c in contractors]
    
    def update_contractor(self, contractor_id: str, data: dict) -> dict:
        """Update contractor information"""
        if contractor_id not in self.contractors:
            raise ValueError(f"Contractor {contractor_id} not found")
        
        contractor = self.contractors[contractor_id]
        
        # Update allowed fields
        allowed_fields = ["business_name", "first_name", "last_name", "email", "phone",
                         "payment_method", "default_rate", "rate_type", "status"]
        
        for field in allowed_fields:
            if field in data:
                contractor[field] = data[field]
        
        # Update address
        if "address" in data:
            contractor["address"].update(data["address"])
        
        # Update W-9 status
        if "w9_on_file" in data:
            contractor["w9_on_file"] = data["w9_on_file"]
            contractor["backup_withholding"] = not data["w9_on_file"]
            if data["w9_on_file"]:
                contractor["w9_received_date"] = date.today().isoformat()
        
        contractor["updated_at"] = datetime.now().isoformat()
        return self._sanitize_contractor(contractor)
    
    def create_payment(self, contractor_id: str, data: dict) -> dict:
        """Create a payment to a contractor"""
        if contractor_id not in self.contractors:
            raise ValueError(f"Contractor {contractor_id} not found")
        
        contractor = self.contractors[contractor_id]
        payment_id = str(uuid.uuid4())
        
        gross_amount = Decimal(str(data["amount"]))
        
        # Calculate backup withholding if applicable
        backup_withholding = Decimal("0.00")
        if contractor["backup_withholding"]:
            backup_withholding = (gross_amount * self.BACKUP_WITHHOLDING_RATE).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        
        net_amount = gross_amount - backup_withholding
        
        payment = {
            "id": payment_id,
            "contractor_id": contractor_id,
            "company_id": self.company_id,
            
            # Payment Details
            "payment_date": data.get("payment_date", date.today().isoformat()),
            "payment_type": data.get("payment_type", "services"),  # services, reimbursement, bonus
            "description": data.get("description", ""),
            "invoice_number": data.get("invoice_number"),
            "project_code": data.get("project_code"),
            
            # Amounts
            "gross_amount": float(gross_amount),
            "backup_withholding": float(backup_withholding),
            "net_amount": float(net_amount),
            
            # Hours/Units if applicable
            "hours": data.get("hours"),
            "rate": data.get("rate"),
            "units": data.get("units"),
            
            # Payment Method
            "payment_method": data.get("payment_method", contractor["payment_method"]),
            "check_number": data.get("check_number"),
            "transaction_id": data.get("transaction_id"),
            
            # Status
            "status": "pending",  # pending, processed, paid, cancelled
            "processed_date": None,
            "created_at": datetime.now().isoformat()
        }
        
        self.payments.append(payment)
        
        # Update YTD totals
        contractor["ytd_payments"] += gross_amount
        contractor["ytd_backup_withholding"] += backup_withholding
        
        return payment
    
    def get_contractor_payments(self, contractor_id: str, year: Optional[int] = None) -> List[dict]:
        """Get all payments for a contractor"""
        payments = [p for p in self.payments if p["contractor_id"] == contractor_id]
        
        if year:
            payments = [p for p in payments 
                       if date.fromisoformat(p["payment_date"]).year == year]
        
        return sorted(payments, key=lambda x: x["payment_date"], reverse=True)
    
    def get_all_payments(self, start_date: Optional[date] = None,
                        end_date: Optional[date] = None,
                        status: Optional[str] = None) -> List[dict]:
        """Get all payments with optional filters"""
        payments = self.payments.copy()
        
        if start_date:
            payments = [p for p in payments 
                       if date.fromisoformat(p["payment_date"]) >= start_date]
        if end_date:
            payments = [p for p in payments 
                       if date.fromisoformat(p["payment_date"]) <= end_date]
        if status:
            payments = [p for p in payments if p["status"] == status]
        
        return sorted(payments, key=lambda x: x["payment_date"], reverse=True)
    
    def process_payment(self, payment_id: str) -> dict:
        """Mark payment as processed"""
        payment = next((p for p in self.payments if p["id"] == payment_id), None)
        if not payment:
            raise ValueError(f"Payment {payment_id} not found")
        
        payment["status"] = "processed"
        payment["processed_date"] = datetime.now().isoformat()
        return payment
    
    def mark_payment_paid(self, payment_id: str, transaction_id: Optional[str] = None) -> dict:
        """Mark payment as paid"""
        payment = next((p for p in self.payments if p["id"] == payment_id), None)
        if not payment:
            raise ValueError(f"Payment {payment_id} not found")
        
        payment["status"] = "paid"
        if transaction_id:
            payment["transaction_id"] = transaction_id
        return payment
    
    def generate_1099_nec(self, contractor_id: str, tax_year: int) -> Optional[dict]:
        """Generate 1099-NEC for a contractor"""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            raise ValueError(f"Contractor {contractor_id} not found")
        
        # Get payments for the tax year
        payments = [p for p in self.payments 
                   if p["contractor_id"] == contractor_id
                   and date.fromisoformat(p["payment_date"]).year == tax_year
                   and p["status"] in ["processed", "paid"]]
        
        total_compensation = sum(Decimal(str(p["gross_amount"])) for p in payments)
        total_withholding = sum(Decimal(str(p["backup_withholding"])) for p in payments)
        
        # Check if threshold is met
        if total_compensation < self.THRESHOLD_1099_NEC:
            return None  # No 1099 required
        
        form_id = str(uuid.uuid4())
        
        form_1099 = {
            "id": form_id,
            "form_type": Form1099Type.NEC.value,
            "tax_year": tax_year,
            "contractor_id": contractor_id,
            "company_id": self.company_id,
            
            # Payer (Company) Info
            "payer": {
                "name": "Your Company Name",  # Would come from company settings
                "address": {},
                "tin": "XX-XXXXXXX"
            },
            
            # Recipient (Contractor) Info
            "recipient": {
                "name": f"{contractor['first_name']} {contractor['last_name']}",
                "business_name": contractor.get("business_name"),
                "address": contractor["address"],
                "tin_last4": contractor["tax_id_last4"],
                "account_number": contractor_id[:8]
            },
            
            # Box Data
            "boxes": {
                "1": float(total_compensation),  # Nonemployee compensation
                "4": float(total_withholding),   # Federal income tax withheld
            },
            
            # Status
            "status": "draft",  # draft, filed, corrected
            "filed_date": None,
            "correction_of": None,
            
            # Metadata
            "payment_count": len(payments),
            "created_at": datetime.now().isoformat(),
            "generated_at": datetime.now().isoformat()
        }
        
        self.forms_1099.append(form_1099)
        return form_1099
    
    def generate_all_1099s(self, tax_year: int) -> dict:
        """Generate 1099-NECs for all contractors who meet the threshold"""
        results = {
            "tax_year": tax_year,
            "generated": [],
            "below_threshold": [],
            "errors": []
        }
        
        for contractor_id, contractor in self.contractors.items():
            try:
                form = self.generate_1099_nec(contractor_id, tax_year)
                if form:
                    results["generated"].append({
                        "contractor_id": contractor_id,
                        "name": f"{contractor['first_name']} {contractor['last_name']}",
                        "amount": form["boxes"]["1"],
                        "form_id": form["id"]
                    })
                else:
                    # Get actual amount for below threshold
                    payments = [p for p in self.payments 
                               if p["contractor_id"] == contractor_id
                               and date.fromisoformat(p["payment_date"]).year == tax_year]
                    total = sum(Decimal(str(p["gross_amount"])) for p in payments)
                    
                    results["below_threshold"].append({
                        "contractor_id": contractor_id,
                        "name": f"{contractor['first_name']} {contractor['last_name']}",
                        "amount": float(total)
                    })
            except Exception as e:
                results["errors"].append({
                    "contractor_id": contractor_id,
                    "error": str(e)
                })
        
        return results
    
    def get_1099_forms(self, tax_year: Optional[int] = None,
                       contractor_id: Optional[str] = None) -> List[dict]:
        """Get 1099 forms with optional filters"""
        forms = self.forms_1099.copy()
        
        if tax_year:
            forms = [f for f in forms if f["tax_year"] == tax_year]
        if contractor_id:
            forms = [f for f in forms if f["contractor_id"] == contractor_id]
        
        return forms
    
    def file_1099(self, form_id: str) -> dict:
        """Mark 1099 as filed"""
        form = next((f for f in self.forms_1099 if f["id"] == form_id), None)
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        form["status"] = "filed"
        form["filed_date"] = datetime.now().isoformat()
        return form
    
    def get_contractor_ytd_summary(self, contractor_id: str, year: int) -> dict:
        """Get YTD summary for a contractor"""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            raise ValueError(f"Contractor {contractor_id} not found")
        
        payments = [p for p in self.payments 
                   if p["contractor_id"] == contractor_id
                   and date.fromisoformat(p["payment_date"]).year == year]
        
        total_gross = sum(Decimal(str(p["gross_amount"])) for p in payments)
        total_withholding = sum(Decimal(str(p["backup_withholding"])) for p in payments)
        total_net = sum(Decimal(str(p["net_amount"])) for p in payments)
        
        # Group by month
        monthly = {}
        for payment in payments:
            month = date.fromisoformat(payment["payment_date"]).strftime("%Y-%m")
            if month not in monthly:
                monthly[month] = Decimal("0.00")
            monthly[month] += Decimal(str(payment["gross_amount"]))
        
        return {
            "contractor_id": contractor_id,
            "contractor_name": f"{contractor['first_name']} {contractor['last_name']}",
            "year": year,
            "payment_count": len(payments),
            "total_gross": float(total_gross),
            "total_withholding": float(total_withholding),
            "total_net": float(total_net),
            "monthly_breakdown": {k: float(v) for k, v in sorted(monthly.items())},
            "requires_1099": total_gross >= self.THRESHOLD_1099_NEC,
            "w9_on_file": contractor["w9_on_file"]
        }
    
    def get_company_contractor_summary(self, year: int) -> dict:
        """Get summary of all contractor activity for a year"""
        total_payments = Decimal("0.00")
        total_withholding = Decimal("0.00")
        contractors_paid = set()
        
        for payment in self.payments:
            if date.fromisoformat(payment["payment_date"]).year == year:
                total_payments += Decimal(str(payment["gross_amount"]))
                total_withholding += Decimal(str(payment["backup_withholding"]))
                contractors_paid.add(payment["contractor_id"])
        
        # Count by threshold
        above_threshold = 0
        below_threshold = 0
        missing_w9 = 0
        
        for contractor_id in contractors_paid:
            contractor = self.contractors.get(contractor_id)
            if not contractor:
                continue
            
            payments = [p for p in self.payments 
                       if p["contractor_id"] == contractor_id
                       and date.fromisoformat(p["payment_date"]).year == year]
            total = sum(Decimal(str(p["gross_amount"])) for p in payments)
            
            if total >= self.THRESHOLD_1099_NEC:
                above_threshold += 1
            else:
                below_threshold += 1
            
            if not contractor["w9_on_file"]:
                missing_w9 += 1
        
        return {
            "year": year,
            "total_contractors_paid": len(contractors_paid),
            "total_payments": float(total_payments),
            "total_backup_withholding": float(total_withholding),
            "contractors_above_threshold": above_threshold,
            "contractors_below_threshold": below_threshold,
            "contractors_missing_w9": missing_w9,
            "forms_1099_required": above_threshold,
            "filing_deadline": f"{year + 1}-01-31"  # Jan 31 of following year
        }
    
    def validate_w9_data(self, data: dict) -> dict:
        """Validate W-9 form data"""
        errors = []
        warnings = []
        
        # Required fields
        if not data.get("name"):
            errors.append("Name is required")
        
        if not data.get("tax_id"):
            errors.append("Tax ID (SSN or EIN) is required")
        elif len(data["tax_id"].replace("-", "")) not in [9]:
            errors.append("Tax ID must be 9 digits")
        
        if not data.get("address"):
            errors.append("Address is required")
        
        # Validate tax classification
        valid_classifications = [e.value for e in ContractorType]
        if data.get("tax_classification") and data["tax_classification"] not in valid_classifications:
            warnings.append(f"Unknown tax classification: {data['tax_classification']}")
        
        # Check for backup withholding
        if data.get("backup_withholding_exempt") and not data.get("exempt_payee_code"):
            warnings.append("Exempt payee code required if claiming backup withholding exemption")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def export_1099_data(self, tax_year: int) -> dict:
        """Export 1099 data for IRS filing (FIRE format compatible)"""
        forms = [f for f in self.forms_1099 if f["tax_year"] == tax_year]
        
        return {
            "tax_year": tax_year,
            "form_count": len(forms),
            "total_compensation": sum(f["boxes"]["1"] for f in forms),
            "total_withholding": sum(f["boxes"]["4"] for f in forms),
            "forms": forms,
            "export_format": "IRS_FIRE",
            "generated_at": datetime.now().isoformat()
        }


# Create singleton instance
contractor_service = SaurelliusContractors("default")
