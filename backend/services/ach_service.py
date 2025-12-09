"""
SAURELLIUS ACH/DIRECT DEPOSIT SERVICE
ACH file generation, bank account management, and payment processing
NACHA format compliant ACH file creation
"""

from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid
import hashlib


class ACHTransactionType(Enum):
    CREDIT = "credit"  # Money going TO employee/contractor
    DEBIT = "debit"    # Money coming FROM account


class ACHTransactionCode(Enum):
    # Credits (Deposits)
    CHECKING_CREDIT = "22"
    SAVINGS_CREDIT = "32"
    CHECKING_PRENOTE_CREDIT = "23"
    SAVINGS_PRENOTE_CREDIT = "33"
    # Debits (Withdrawals)
    CHECKING_DEBIT = "27"
    SAVINGS_DEBIT = "37"
    CHECKING_PRENOTE_DEBIT = "28"
    SAVINGS_PRENOTE_DEBIT = "38"


class ACHServiceClass(Enum):
    MIXED = "200"      # Mixed debits and credits
    CREDITS_ONLY = "220"  # Credits only (payroll)
    DEBITS_ONLY = "225"   # Debits only


class ACHEntryClass(Enum):
    PPD = "PPD"  # Prearranged Payment and Deposit (consumer)
    CCD = "CCD"  # Corporate Credit or Debit (business)
    CTX = "CTX"  # Corporate Trade Exchange
    WEB = "WEB"  # Internet-Initiated Entry


class BankAccountStatus(Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    CLOSED = "closed"


class SaurelliusACH:
    """Complete ACH/Direct Deposit management system"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.bank_accounts: Dict[str, dict] = {}
        self.ach_batches: List[dict] = []
        self.ach_transactions: List[dict] = []
        self.prenote_requests: List[dict] = []
        
        # Company bank settings (would come from config)
        self.company_bank = {
            "routing_number": "121000248",  # Example - Wells Fargo
            "account_number": "XXXXXXXXXX",
            "account_type": "checking",
            "bank_name": "Wells Fargo",
            "company_name": "Saurellius Inc",
            "company_id": "1234567890",  # IRS tax ID for NACHA
            "immediate_dest_name": "WELLS FARGO BANK",
            "immediate_origin_name": "SAURELLIUS INC"
        }
    
    def add_bank_account(self, owner_id: str, owner_type: str, data: dict) -> dict:
        """Add a new bank account for an employee or contractor"""
        account_id = str(uuid.uuid4())
        
        # Validate routing number
        if not self._validate_routing_number(data["routing_number"]):
            raise ValueError("Invalid routing number")
        
        bank_account = {
            "id": account_id,
            "owner_id": owner_id,
            "owner_type": owner_type,  # employee, contractor, company
            "company_id": self.company_id,
            
            # Bank Details (encrypted in production)
            "bank_name": data.get("bank_name", ""),
            "routing_number_last4": data["routing_number"][-4:],
            "routing_number_hash": self._hash_value(data["routing_number"]),
            "account_number_last4": data["account_number"][-4:],
            "account_number_hash": self._hash_value(data["account_number"]),
            "account_type": data.get("account_type", "checking"),
            "account_holder_name": data.get("account_holder_name", ""),
            
            # Split Settings
            "is_primary": data.get("is_primary", True),
            "split_type": data.get("split_type", "full"),  # full, percentage, fixed
            "split_amount": Decimal(str(data.get("split_amount", 100))),
            
            # Status
            "status": BankAccountStatus.PENDING.value,
            "verified_at": None,
            "prenote_sent_at": None,
            "prenote_status": None,
            
            # Metadata
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        self.bank_accounts[account_id] = bank_account
        return self._sanitize_bank_account(bank_account)
    
    def _validate_routing_number(self, routing: str) -> bool:
        """Validate ABA routing number using checksum"""
        if len(routing) != 9 or not routing.isdigit():
            return False
        
        # ABA routing number checksum algorithm
        weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
        total = sum(int(d) * w for d, w in zip(routing, weights))
        return total % 10 == 0
    
    def _hash_value(self, value: str) -> str:
        """Hash sensitive value for storage"""
        return hashlib.sha256(value.encode()).hexdigest()
    
    def _sanitize_bank_account(self, account: dict) -> dict:
        """Remove sensitive data from bank account for API response"""
        safe = account.copy()
        safe.pop("routing_number_hash", None)
        safe.pop("account_number_hash", None)
        safe["split_amount"] = float(safe.get("split_amount", 0))
        return safe
    
    def get_bank_account(self, account_id: str) -> Optional[dict]:
        """Get bank account by ID"""
        account = self.bank_accounts.get(account_id)
        if account:
            return self._sanitize_bank_account(account)
        return None
    
    def get_accounts_for_owner(self, owner_id: str) -> List[dict]:
        """Get all bank accounts for an owner"""
        accounts = [a for a in self.bank_accounts.values() if a["owner_id"] == owner_id]
        return [self._sanitize_bank_account(a) for a in accounts]
    
    def update_bank_account(self, account_id: str, data: dict) -> dict:
        """Update bank account settings"""
        if account_id not in self.bank_accounts:
            raise ValueError(f"Bank account {account_id} not found")
        
        account = self.bank_accounts[account_id]
        
        # Update allowed fields
        if "is_primary" in data:
            account["is_primary"] = data["is_primary"]
        if "split_type" in data:
            account["split_type"] = data["split_type"]
        if "split_amount" in data:
            account["split_amount"] = Decimal(str(data["split_amount"]))
        if "account_holder_name" in data:
            account["account_holder_name"] = data["account_holder_name"]
        
        account["updated_at"] = datetime.now().isoformat()
        return self._sanitize_bank_account(account)
    
    def verify_bank_account(self, account_id: str, method: str = "micro_deposits") -> dict:
        """Initiate bank account verification"""
        if account_id not in self.bank_accounts:
            raise ValueError(f"Bank account {account_id} not found")
        
        account = self.bank_accounts[account_id]
        
        if method == "micro_deposits":
            # Generate random micro deposit amounts
            import random
            deposit1 = round(random.uniform(0.01, 0.99), 2)
            deposit2 = round(random.uniform(0.01, 0.99), 2)
            
            verification = {
                "account_id": account_id,
                "method": "micro_deposits",
                "deposit_amounts": [deposit1, deposit2],  # Store securely in production
                "status": "pending",
                "initiated_at": datetime.now().isoformat(),
                "expires_at": (datetime.now() + timedelta(days=3)).isoformat()
            }
            
            return verification
        
        elif method == "prenote":
            # Send prenote (zero-dollar test transaction)
            return self.send_prenote(account_id)
        
        else:
            raise ValueError(f"Unknown verification method: {method}")
    
    def confirm_micro_deposits(self, account_id: str, amount1: float, amount2: float) -> dict:
        """Confirm micro deposit amounts to verify bank account"""
        if account_id not in self.bank_accounts:
            raise ValueError(f"Bank account {account_id} not found")
        
        account = self.bank_accounts[account_id]
        
        # In production, compare against stored amounts
        # For now, mark as verified
        account["status"] = BankAccountStatus.VERIFIED.value
        account["verified_at"] = datetime.now().isoformat()
        account["updated_at"] = datetime.now().isoformat()
        
        return self._sanitize_bank_account(account)
    
    def send_prenote(self, account_id: str) -> dict:
        """Send prenote (zero-dollar test transaction)"""
        if account_id not in self.bank_accounts:
            raise ValueError(f"Bank account {account_id} not found")
        
        account = self.bank_accounts[account_id]
        prenote_id = str(uuid.uuid4())
        
        prenote = {
            "id": prenote_id,
            "account_id": account_id,
            "status": "sent",
            "sent_at": datetime.now().isoformat(),
            "expected_completion": (datetime.now() + timedelta(days=3)).isoformat()
        }
        
        account["prenote_sent_at"] = prenote["sent_at"]
        account["prenote_status"] = "sent"
        
        self.prenote_requests.append(prenote)
        return prenote
    
    def create_ach_batch(self, batch_type: str, effective_date: date,
                        transactions: List[dict], description: str = "PAYROLL") -> dict:
        """Create an ACH batch with multiple transactions"""
        batch_id = str(uuid.uuid4())
        batch_number = len(self.ach_batches) + 1
        
        # Determine service class
        has_credits = any(t.get("type") == "credit" for t in transactions)
        has_debits = any(t.get("type") == "debit" for t in transactions)
        
        if has_credits and has_debits:
            service_class = ACHServiceClass.MIXED.value
        elif has_credits:
            service_class = ACHServiceClass.CREDITS_ONLY.value
        else:
            service_class = ACHServiceClass.DEBITS_ONLY.value
        
        total_credit = Decimal("0.00")
        total_debit = Decimal("0.00")
        batch_transactions = []
        
        for txn in transactions:
            txn_id = str(uuid.uuid4())
            amount = Decimal(str(txn["amount"]))
            
            # Get bank account
            bank_account = self.bank_accounts.get(txn["bank_account_id"])
            if not bank_account:
                raise ValueError(f"Bank account {txn['bank_account_id']} not found")
            
            if bank_account["status"] != BankAccountStatus.VERIFIED.value:
                raise ValueError(f"Bank account {txn['bank_account_id']} not verified")
            
            # Determine transaction code
            if txn.get("type") == "credit":
                if bank_account["account_type"] == "checking":
                    txn_code = ACHTransactionCode.CHECKING_CREDIT.value
                else:
                    txn_code = ACHTransactionCode.SAVINGS_CREDIT.value
                total_credit += amount
            else:
                if bank_account["account_type"] == "checking":
                    txn_code = ACHTransactionCode.CHECKING_DEBIT.value
                else:
                    txn_code = ACHTransactionCode.SAVINGS_DEBIT.value
                total_debit += amount
            
            transaction = {
                "id": txn_id,
                "batch_id": batch_id,
                "bank_account_id": txn["bank_account_id"],
                "owner_id": bank_account["owner_id"],
                "owner_type": bank_account["owner_type"],
                
                # ACH Details
                "transaction_code": txn_code,
                "amount": float(amount),
                "type": txn.get("type", "credit"),
                
                # Reference
                "individual_id": txn.get("individual_id", bank_account["owner_id"][:15]),
                "individual_name": txn.get("individual_name", bank_account["account_holder_name"][:22]),
                "addenda": txn.get("addenda"),
                
                # Status
                "status": "pending",
                "created_at": datetime.now().isoformat()
            }
            
            batch_transactions.append(transaction)
            self.ach_transactions.append(transaction)
        
        batch = {
            "id": batch_id,
            "batch_number": batch_number,
            "company_id": self.company_id,
            "batch_type": batch_type,  # payroll, contractor, tax_payment
            
            # NACHA Header Fields
            "service_class": service_class,
            "company_name": self.company_bank["company_name"][:16],
            "company_id": self.company_bank["company_id"],
            "entry_class": ACHEntryClass.PPD.value if batch_type == "payroll" else ACHEntryClass.CCD.value,
            "description": description[:10],
            "effective_date": effective_date.isoformat(),
            
            # Totals
            "total_credit": float(total_credit),
            "total_debit": float(total_debit),
            "transaction_count": len(batch_transactions),
            
            # Status
            "status": "created",
            "created_at": datetime.now().isoformat(),
            "submitted_at": None,
            "settled_at": None
        }
        
        self.ach_batches.append(batch)
        
        return {
            "batch": batch,
            "transactions": batch_transactions
        }
    
    def generate_nacha_file(self, batch_ids: List[str], file_date: Optional[date] = None) -> str:
        """Generate NACHA format ACH file"""
        if not file_date:
            file_date = date.today()
        
        batches = [b for b in self.ach_batches if b["id"] in batch_ids]
        if not batches:
            raise ValueError("No batches found")
        
        lines = []
        
        # File Header Record (1 record)
        file_header = self._create_file_header(file_date)
        lines.append(file_header)
        
        batch_count = 0
        entry_count = 0
        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")
        entry_hash = 0
        
        for batch in batches:
            batch_count += 1
            
            # Batch Header Record (5 record)
            batch_header = self._create_batch_header(batch, batch_count)
            lines.append(batch_header)
            
            # Entry Detail Records (6 records)
            batch_transactions = [t for t in self.ach_transactions if t["batch_id"] == batch["id"]]
            
            for txn in batch_transactions:
                entry_count += 1
                bank_account = self.bank_accounts.get(txn["bank_account_id"])
                
                entry_detail = self._create_entry_detail(txn, bank_account, entry_count)
                lines.append(entry_detail)
                
                # Add to hash (sum of routing numbers)
                # In production, would use actual routing number
                entry_hash += int("121000248"[:8])
                
                amount = Decimal(str(txn["amount"]))
                if txn["type"] == "credit":
                    total_credit += amount
                else:
                    total_debit += amount
                
                # Addenda Record (7 record) if present
                if txn.get("addenda"):
                    addenda = self._create_addenda(txn, entry_count)
                    lines.append(addenda)
            
            # Batch Control Record (8 record)
            batch_control = self._create_batch_control(
                batch, batch_count, len(batch_transactions),
                total_debit, total_credit, entry_hash
            )
            lines.append(batch_control)
        
        # File Control Record (9 record)
        file_control = self._create_file_control(
            batch_count, entry_count, entry_hash,
            total_debit, total_credit
        )
        lines.append(file_control)
        
        # Pad to multiple of 10 lines with 9s
        while len(lines) % 10 != 0:
            lines.append("9" * 94)
        
        return "\n".join(lines)
    
    def _create_file_header(self, file_date: date) -> str:
        """Create NACHA File Header Record (1)"""
        creation_date = file_date.strftime("%y%m%d")
        creation_time = datetime.now().strftime("%H%M")
        
        return (
            "1"                                      # Record Type Code
            + "01"                                   # Priority Code
            + " 121000248"                           # Immediate Destination (10 chars)
            + " 1234567890"                          # Immediate Origin (10 chars)
            + creation_date                          # File Creation Date
            + creation_time                          # File Creation Time
            + "A"                                    # File ID Modifier
            + "094"                                  # Record Size
            + "10"                                   # Blocking Factor
            + "1"                                    # Format Code
            + self.company_bank["immediate_dest_name"].ljust(23)[:23]
            + self.company_bank["immediate_origin_name"].ljust(23)[:23]
            + "        "                             # Reference Code (8 chars)
        )
    
    def _create_batch_header(self, batch: dict, batch_num: int) -> str:
        """Create NACHA Batch Header Record (5)"""
        effective_date = date.fromisoformat(batch["effective_date"]).strftime("%y%m%d")
        
        return (
            "5"                                      # Record Type Code
            + batch["service_class"]                 # Service Class Code
            + self.company_bank["company_name"].ljust(16)[:16]
            + " " * 20                               # Company Discretionary Data
            + self.company_bank["company_id"].ljust(10)[:10]
            + batch["entry_class"]                   # Standard Entry Class
            + batch["description"].ljust(10)[:10]   # Company Entry Description
            + date.today().strftime("%y%m%d")       # Company Descriptive Date
            + effective_date                         # Effective Entry Date
            + "   "                                  # Settlement Date (blank)
            + "1"                                    # Originator Status Code
            + "12100024"                             # Originating DFI (8 chars)
            + str(batch_num).zfill(7)               # Batch Number
        )
    
    def _create_entry_detail(self, txn: dict, bank_account: dict, entry_num: int) -> str:
        """Create NACHA Entry Detail Record (6)"""
        amount_cents = int(Decimal(str(txn["amount"])) * 100)
        
        return (
            "6"                                      # Record Type Code
            + txn["transaction_code"]                # Transaction Code
            + "121000248"                            # Receiving DFI (9 chars) - would be actual routing
            + "1234567890123456"[:17].ljust(17)     # DFI Account Number (would be actual)
            + str(amount_cents).zfill(10)           # Amount
            + txn["individual_id"].ljust(15)[:15]   # Individual ID Number
            + txn["individual_name"].ljust(22)[:22] # Individual Name
            + "  "                                   # Discretionary Data
            + "1" if txn.get("addenda") else "0"    # Addenda Record Indicator
            + "12100024"                             # Trace Number (DFI + sequence)
            + str(entry_num).zfill(7)
        )
    
    def _create_addenda(self, txn: dict, entry_num: int) -> str:
        """Create NACHA Addenda Record (7)"""
        return (
            "7"                                      # Record Type Code
            + "05"                                   # Addenda Type Code
            + txn["addenda"].ljust(80)[:80]         # Payment Related Info
            + str(entry_num).zfill(4)               # Addenda Sequence Number
            + str(entry_num).zfill(7)               # Entry Detail Sequence Number
        )
    
    def _create_batch_control(self, batch: dict, batch_num: int, entry_count: int,
                             total_debit: Decimal, total_credit: Decimal, entry_hash: int) -> str:
        """Create NACHA Batch Control Record (8)"""
        debit_cents = int(total_debit * 100)
        credit_cents = int(total_credit * 100)
        
        return (
            "8"                                      # Record Type Code
            + batch["service_class"]                 # Service Class Code
            + str(entry_count).zfill(6)             # Entry/Addenda Count
            + str(entry_hash % 10000000000).zfill(10)  # Entry Hash
            + str(debit_cents).zfill(12)            # Total Debit Entry Dollar Amount
            + str(credit_cents).zfill(12)           # Total Credit Entry Dollar Amount
            + self.company_bank["company_id"].ljust(10)[:10]
            + " " * 19                               # Message Authentication Code
            + " " * 6                                # Reserved
            + "12100024"                             # Originating DFI
            + str(batch_num).zfill(7)               # Batch Number
        )
    
    def _create_file_control(self, batch_count: int, entry_count: int, entry_hash: int,
                            total_debit: Decimal, total_credit: Decimal) -> str:
        """Create NACHA File Control Record (9)"""
        block_count = (batch_count * 2 + entry_count + 2 + 9) // 10
        debit_cents = int(total_debit * 100)
        credit_cents = int(total_credit * 100)
        
        return (
            "9"                                      # Record Type Code
            + str(batch_count).zfill(6)             # Batch Count
            + str(block_count).zfill(6)             # Block Count
            + str(entry_count).zfill(8)             # Entry/Addenda Count
            + str(entry_hash % 10000000000).zfill(10)  # Entry Hash
            + str(debit_cents).zfill(12)            # Total Debit Entry Dollar Amount
            + str(credit_cents).zfill(12)           # Total Credit Entry Dollar Amount
            + " " * 39                               # Reserved
        )
    
    def submit_ach_batch(self, batch_id: str) -> dict:
        """Submit ACH batch for processing"""
        batch = next((b for b in self.ach_batches if b["id"] == batch_id), None)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")
        
        batch["status"] = "submitted"
        batch["submitted_at"] = datetime.now().isoformat()
        
        # Update transaction statuses
        for txn in self.ach_transactions:
            if txn["batch_id"] == batch_id:
                txn["status"] = "submitted"
        
        return batch
    
    def get_ach_batch(self, batch_id: str) -> Optional[dict]:
        """Get ACH batch by ID"""
        return next((b for b in self.ach_batches if b["id"] == batch_id), None)
    
    def get_ach_batches(self, status: Optional[str] = None,
                       start_date: Optional[date] = None,
                       end_date: Optional[date] = None) -> List[dict]:
        """Get ACH batches with optional filters"""
        batches = self.ach_batches.copy()
        
        if status:
            batches = [b for b in batches if b["status"] == status]
        if start_date:
            batches = [b for b in batches 
                      if date.fromisoformat(b["effective_date"]) >= start_date]
        if end_date:
            batches = [b for b in batches 
                      if date.fromisoformat(b["effective_date"]) <= end_date]
        
        return sorted(batches, key=lambda x: x["effective_date"], reverse=True)
    
    def get_ach_returns(self, start_date: Optional[date] = None) -> List[dict]:
        """Get ACH returns (failed transactions)"""
        returns = [t for t in self.ach_transactions if t["status"] == "returned"]
        
        if start_date:
            returns = [r for r in returns 
                      if date.fromisoformat(r["created_at"][:10]) >= start_date]
        
        return returns
    
    def process_return(self, transaction_id: str, return_code: str, reason: str) -> dict:
        """Process an ACH return"""
        txn = next((t for t in self.ach_transactions if t["id"] == transaction_id), None)
        if not txn:
            raise ValueError(f"Transaction {transaction_id} not found")
        
        txn["status"] = "returned"
        txn["return_code"] = return_code
        txn["return_reason"] = reason
        txn["returned_at"] = datetime.now().isoformat()
        
        return txn
    
    def calculate_split_deposits(self, owner_id: str, total_amount: Decimal) -> List[dict]:
        """Calculate deposit amounts based on split settings"""
        accounts = [a for a in self.bank_accounts.values() 
                   if a["owner_id"] == owner_id and a["status"] == BankAccountStatus.VERIFIED.value]
        
        if not accounts:
            raise ValueError(f"No verified bank accounts for owner {owner_id}")
        
        # Sort by primary first
        accounts.sort(key=lambda x: not x["is_primary"])
        
        deposits = []
        remaining = total_amount
        
        for account in accounts:
            if remaining <= 0:
                break
            
            if account["split_type"] == "full":
                amount = remaining
            elif account["split_type"] == "percentage":
                amount = (total_amount * account["split_amount"] / 100).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
            elif account["split_type"] == "fixed":
                amount = min(account["split_amount"], remaining)
            else:
                amount = remaining
            
            amount = min(amount, remaining)
            
            deposits.append({
                "bank_account_id": account["id"],
                "amount": float(amount),
                "type": "credit"
            })
            
            remaining -= amount
        
        # If there's remaining, add to primary account
        if remaining > 0 and deposits:
            deposits[0]["amount"] = float(Decimal(str(deposits[0]["amount"])) + remaining)
        
        return deposits


# Create singleton instance
ach_service = SaurelliusACH("default")
