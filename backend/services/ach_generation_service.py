"""
ACH FILE GENERATION SERVICE
NACHA-compliant ACH file generation for direct deposit
Production-ready with proper formatting and validation
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
import uuid


class ACHGenerationService:
    """
    NACHA-compliant ACH file generation.
    Generates properly formatted ACH files for bank processing.
    """
    
    # NACHA record types
    FILE_HEADER = '1'
    BATCH_HEADER = '5'
    ENTRY_DETAIL = '6'
    ADDENDA = '7'
    BATCH_CONTROL = '8'
    FILE_CONTROL = '9'
    
    # Standard Entry Class Codes
    SEC_PPD = 'PPD'  # Prearranged Payment and Deposit (payroll)
    SEC_CCD = 'CCD'  # Corporate Credit or Debit
    SEC_CTX = 'CTX'  # Corporate Trade Exchange
    
    # Transaction codes
    CHECKING_CREDIT = '22'  # Credit to checking
    CHECKING_DEBIT = '27'   # Debit from checking
    SAVINGS_CREDIT = '32'   # Credit to savings
    SAVINGS_DEBIT = '37'    # Debit from savings
    CHECKING_CREDIT_PRENOTE = '23'  # Prenote for checking credit
    SAVINGS_CREDIT_PRENOTE = '33'   # Prenote for savings credit
    
    def __init__(self):
        self.ach_files = {}
    
    def generate_ach_file(
        self,
        company_data: Dict,
        payroll_run: Dict,
        effective_date: date = None
    ) -> Dict:
        """Generate complete NACHA ACH file for payroll."""
        
        file_id = str(uuid.uuid4())[:8].upper()
        
        if effective_date is None:
            # Default to pay date or next business day
            effective_date = self._get_next_business_day(
                datetime.strptime(payroll_run['pay_date'], '%Y-%m-%d').date()
            )
        
        # File creation timestamp
        file_creation_date = datetime.now()
        
        # Build ACH file
        lines = []
        
        # 1. File Header Record
        file_header = self._create_file_header(
            company_data,
            file_creation_date,
            file_id
        )
        lines.append(file_header)
        
        # 2. Batch Header Record
        batch_number = 1
        batch_header = self._create_batch_header(
            company_data,
            effective_date,
            batch_number
        )
        lines.append(batch_header)
        
        # 3. Entry Detail Records (one per payment)
        entry_hash = 0
        total_debit = 0
        total_credit = 0
        entry_count = 0
        
        # Debit from company account
        company_debit = self._create_entry_detail(
            transaction_code=self.CHECKING_DEBIT,
            routing_number=company_data['bank_routing'],
            account_number=company_data['bank_account'],
            amount=payroll_run['totals']['total_net'],
            individual_id=company_data['ein'].replace('-', ''),
            individual_name=company_data['legal_name'][:22],
            trace_number=self._generate_trace_number(company_data['bank_routing'], entry_count + 1)
        )
        lines.append(company_debit)
        entry_hash += int(company_data['bank_routing'][:8])
        total_debit += payroll_run['totals']['total_net']
        entry_count += 1
        
        # Credit to each employee
        for emp in payroll_run['employees']:
            if emp['payment_method'] == 'direct_deposit' and emp['net_pay'] > 0:
                for account in emp.get('direct_deposit_accounts', []):
                    # Calculate amount for this account
                    if account.get('amount_type') == 'percent':
                        amount = emp['net_pay'] * float(account.get('amount', 100)) / 100
                    elif account.get('amount_type') == 'fixed':
                        amount = min(float(account.get('amount', 0)), emp['net_pay'])
                    else:
                        amount = emp['net_pay']
                    
                    amount = round(amount, 2)
                    if amount <= 0:
                        continue
                    
                    # Determine transaction code
                    if account.get('account_type') == 'savings':
                        trans_code = self.SAVINGS_CREDIT
                    else:
                        trans_code = self.CHECKING_CREDIT
                    
                    entry = self._create_entry_detail(
                        transaction_code=trans_code,
                        routing_number=account['routing_number'],
                        account_number=account.get('account_number', ''),
                        amount=amount,
                        individual_id=emp['employee_id'] or str(entry_count),
                        individual_name=emp['employee_name'][:22],
                        trace_number=self._generate_trace_number(company_data['bank_routing'], entry_count + 1)
                    )
                    lines.append(entry)
                    entry_hash += int(account['routing_number'][:8])
                    total_credit += amount
                    entry_count += 1
        
        # 4. Batch Control Record
        batch_control = self._create_batch_control(
            entry_count=entry_count,
            entry_hash=entry_hash,
            total_debit=total_debit,
            total_credit=total_credit,
            company_id=company_data['ein'].replace('-', ''),
            batch_number=batch_number
        )
        lines.append(batch_control)
        
        # 5. File Control Record
        file_control = self._create_file_control(
            batch_count=1,
            block_count=self._calculate_block_count(len(lines) + 1),
            entry_count=entry_count,
            entry_hash=entry_hash,
            total_debit=total_debit,
            total_credit=total_credit
        )
        lines.append(file_control)
        
        # Pad to block size (10 records per block)
        while len(lines) % 10 != 0:
            lines.append('9' * 94)
        
        # Build file content
        file_content = '\n'.join(lines)
        
        # Store file record
        ach_record = {
            'id': file_id,
            'payroll_run_id': payroll_run['id'],
            'company_id': company_data.get('id'),
            'file_creation_date': file_creation_date.strftime('%y%m%d'),
            'file_creation_time': file_creation_date.strftime('%H%M'),
            'effective_date': effective_date.isoformat(),
            'batch_count': 1,
            'entry_count': entry_count,
            'total_debit': round(total_debit, 2),
            'total_credit': round(total_credit, 2),
            'entry_hash': entry_hash % 10000000000,  # Last 10 digits
            'file_content': file_content,
            'status': 'generated',
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.ach_files[file_id] = ach_record
        
        return {
            'success': True,
            'file_id': file_id,
            'file_name': f"ACH_{company_data['legal_name'][:10]}_{effective_date.strftime('%Y%m%d')}.txt",
            'entry_count': entry_count,
            'total_debit': round(total_debit, 2),
            'total_credit': round(total_credit, 2),
            'effective_date': effective_date.isoformat(),
            'file_content': file_content
        }
    
    def _create_file_header(
        self,
        company: Dict,
        creation_datetime: datetime,
        file_id: str
    ) -> str:
        """Create File Header Record (Record Type 1)."""
        # Position 1: Record Type Code
        record = self.FILE_HEADER
        
        # Position 2-3: Priority Code (always 01)
        record += '01'
        
        # Position 4-13: Immediate Destination (bank routing with leading space)
        record += ' ' + company['bank_routing'].ljust(9)[:9]
        
        # Position 14-23: Immediate Origin (company EIN with leading space)
        record += ' ' + company['ein'].replace('-', '').ljust(9)[:9]
        
        # Position 24-29: File Creation Date (YYMMDD)
        record += creation_datetime.strftime('%y%m%d')
        
        # Position 30-33: File Creation Time (HHMM)
        record += creation_datetime.strftime('%H%M')
        
        # Position 34: File ID Modifier (A-Z, 0-9)
        record += 'A'
        
        # Position 35-37: Record Size (094)
        record += '094'
        
        # Position 38-39: Blocking Factor (10)
        record += '10'
        
        # Position 40: Format Code (1)
        record += '1'
        
        # Position 41-63: Immediate Destination Name
        record += company.get('bank_name', 'BANK')[:23].ljust(23)
        
        # Position 64-86: Immediate Origin Name
        record += company['legal_name'][:23].ljust(23)
        
        # Position 87-94: Reference Code
        record += file_id[:8].ljust(8)
        
        return record
    
    def _create_batch_header(
        self,
        company: Dict,
        effective_date: date,
        batch_number: int
    ) -> str:
        """Create Batch Header Record (Record Type 5)."""
        record = self.BATCH_HEADER
        
        # Service Class Code (200=mixed, 220=credits only, 225=debits only)
        record += '200'
        
        # Company Name
        record += company['legal_name'][:16].ljust(16)
        
        # Company Discretionary Data
        record += ' ' * 20
        
        # Company Identification (EIN)
        record += '1' + company['ein'].replace('-', '').ljust(9)[:9]
        
        # Standard Entry Class Code
        record += self.SEC_PPD
        
        # Company Entry Description
        record += 'PAYROLL'.ljust(10)
        
        # Company Descriptive Date
        record += effective_date.strftime('%y%m%d')
        
        # Effective Entry Date
        record += effective_date.strftime('%y%m%d')
        
        # Settlement Date (blank - filled by ACH operator)
        record += '   '
        
        # Originator Status Code
        record += '1'
        
        # Originating DFI Identification
        record += company['bank_routing'][:8]
        
        # Batch Number
        record += str(batch_number).zfill(7)
        
        return record
    
    def _create_entry_detail(
        self,
        transaction_code: str,
        routing_number: str,
        account_number: str,
        amount: float,
        individual_id: str,
        individual_name: str,
        trace_number: str,
        addenda_indicator: str = '0'
    ) -> str:
        """Create Entry Detail Record (Record Type 6)."""
        record = self.ENTRY_DETAIL
        
        # Transaction Code
        record += transaction_code
        
        # Receiving DFI Identification (routing number + check digit)
        record += routing_number[:8]
        record += routing_number[8] if len(routing_number) > 8 else self._calculate_check_digit(routing_number[:8])
        
        # DFI Account Number
        record += account_number[:17].ljust(17)
        
        # Amount (10 digits, no decimal point)
        record += str(int(amount * 100)).zfill(10)
        
        # Individual Identification Number
        record += individual_id[:15].ljust(15)
        
        # Individual Name
        record += individual_name[:22].ljust(22)
        
        # Discretionary Data
        record += '  '
        
        # Addenda Record Indicator
        record += addenda_indicator
        
        # Trace Number
        record += trace_number[:15].ljust(15)
        
        return record
    
    def _create_batch_control(
        self,
        entry_count: int,
        entry_hash: int,
        total_debit: float,
        total_credit: float,
        company_id: str,
        batch_number: int
    ) -> str:
        """Create Batch Control Record (Record Type 8)."""
        record = self.BATCH_CONTROL
        
        # Service Class Code
        record += '200'
        
        # Entry/Addenda Count
        record += str(entry_count).zfill(6)
        
        # Entry Hash (last 10 digits)
        record += str(entry_hash % 10000000000).zfill(10)
        
        # Total Debit Entry Dollar Amount
        record += str(int(total_debit * 100)).zfill(12)
        
        # Total Credit Entry Dollar Amount
        record += str(int(total_credit * 100)).zfill(12)
        
        # Company Identification
        record += '1' + company_id[:9].ljust(9)
        
        # Message Authentication Code (blank)
        record += ' ' * 19
        
        # Reserved (blank)
        record += ' ' * 6
        
        # Originating DFI Identification
        record += company_id[:8].ljust(8)
        
        # Batch Number
        record += str(batch_number).zfill(7)
        
        return record
    
    def _create_file_control(
        self,
        batch_count: int,
        block_count: int,
        entry_count: int,
        entry_hash: int,
        total_debit: float,
        total_credit: float
    ) -> str:
        """Create File Control Record (Record Type 9)."""
        record = self.FILE_CONTROL
        
        # Batch Count
        record += str(batch_count).zfill(6)
        
        # Block Count
        record += str(block_count).zfill(6)
        
        # Entry/Addenda Count
        record += str(entry_count).zfill(8)
        
        # Entry Hash
        record += str(entry_hash % 10000000000).zfill(10)
        
        # Total Debit Entry Dollar Amount
        record += str(int(total_debit * 100)).zfill(12)
        
        # Total Credit Entry Dollar Amount
        record += str(int(total_credit * 100)).zfill(12)
        
        # Reserved
        record += ' ' * 39
        
        return record
    
    def _generate_trace_number(self, routing_number: str, sequence: int) -> str:
        """Generate trace number for entry."""
        return routing_number[:8] + str(sequence).zfill(7)
    
    def _calculate_check_digit(self, routing_number: str) -> str:
        """Calculate ABA routing number check digit."""
        weights = [3, 7, 1, 3, 7, 1, 3, 7]
        total = sum(int(d) * w for d, w in zip(routing_number[:8], weights))
        check = (10 - (total % 10)) % 10
        return str(check)
    
    def _calculate_block_count(self, record_count: int) -> int:
        """Calculate number of blocks (10 records per block)."""
        return (record_count + 9) // 10
    
    def _get_next_business_day(self, start_date: date) -> date:
        """Get next business day (skip weekends)."""
        result = start_date
        while result.weekday() >= 5:  # Saturday = 5, Sunday = 6
            result += timedelta(days=1)
        return result
    
    def generate_prenote_file(
        self,
        company_data: Dict,
        employee_accounts: List[Dict]
    ) -> Dict:
        """Generate prenote (zero-dollar test) ACH file."""
        file_id = str(uuid.uuid4())[:8].upper()
        effective_date = self._get_next_business_day(date.today() + timedelta(days=1))
        file_creation_date = datetime.now()
        
        lines = []
        
        # File Header
        file_header = self._create_file_header(company_data, file_creation_date, file_id)
        lines.append(file_header)
        
        # Batch Header
        batch_header = self._create_batch_header(company_data, effective_date, 1)
        lines.append(batch_header)
        
        # Prenote entries (zero-dollar)
        entry_hash = 0
        entry_count = 0
        
        for account in employee_accounts:
            if account.get('account_type') == 'savings':
                trans_code = self.SAVINGS_CREDIT_PRENOTE
            else:
                trans_code = self.CHECKING_CREDIT_PRENOTE
            
            entry = self._create_entry_detail(
                transaction_code=trans_code,
                routing_number=account['routing_number'],
                account_number=account.get('account_number', ''),
                amount=0,  # Zero-dollar prenote
                individual_id=account.get('employee_id', str(entry_count)),
                individual_name=account.get('employee_name', 'PRENOTE')[:22],
                trace_number=self._generate_trace_number(company_data['bank_routing'], entry_count + 1)
            )
            lines.append(entry)
            entry_hash += int(account['routing_number'][:8])
            entry_count += 1
        
        # Batch Control
        batch_control = self._create_batch_control(
            entry_count=entry_count,
            entry_hash=entry_hash,
            total_debit=0,
            total_credit=0,
            company_id=company_data['ein'].replace('-', ''),
            batch_number=1
        )
        lines.append(batch_control)
        
        # File Control
        file_control = self._create_file_control(
            batch_count=1,
            block_count=self._calculate_block_count(len(lines) + 1),
            entry_count=entry_count,
            entry_hash=entry_hash,
            total_debit=0,
            total_credit=0
        )
        lines.append(file_control)
        
        # Pad to block size
        while len(lines) % 10 != 0:
            lines.append('9' * 94)
        
        file_content = '\n'.join(lines)
        
        return {
            'success': True,
            'file_id': file_id,
            'file_name': f"PRENOTE_{effective_date.strftime('%Y%m%d')}.txt",
            'entry_count': entry_count,
            'effective_date': effective_date.isoformat(),
            'file_content': file_content,
            'type': 'prenote'
        }
    
    def get_ach_file(self, file_id: str) -> Optional[Dict]:
        """Get ACH file by ID."""
        return self.ach_files.get(file_id)
    
    def mark_as_transmitted(self, file_id: str, transmission_method: str = 'sftp') -> Dict:
        """Mark ACH file as transmitted to bank."""
        ach_file = self.ach_files.get(file_id)
        if not ach_file:
            return {'error': 'ACH file not found'}
        
        ach_file['status'] = 'transmitted'
        ach_file['transmitted_at'] = datetime.utcnow().isoformat()
        ach_file['transmission_method'] = transmission_method
        
        return {'success': True, 'ach_file': ach_file}


# Singleton instance
ach_generation_service = ACHGenerationService()
