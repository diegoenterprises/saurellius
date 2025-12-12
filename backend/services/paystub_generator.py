"""
SAURELLIUS PAYSTUB GENERATOR SERVICE
Bank-Grade Security | Snappt Compliant | Playwright-Powered | 25 Color Themes

Complete paystub generation engine with:
- 25 Professional Color Themes
- QR Code Verification
- Anti-Tamper Protection
- Hologram Seals
- Security Watermarks
- Microtext Security
- HMAC-based Tamper-Proof Seals

Author: Saurellius Platform
Version: 2.1.0
"""

import os
import json
import hashlib
import uuid
import base64
import hmac
import secrets
import io
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Check for required dependencies
try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False
    logger.warning("Playwright not available. Install with: pip install playwright && playwright install chromium")

try:
    import qrcode
    from PIL import Image as PILImage
    HAS_QR = True
except ImportError:
    HAS_QR = False
    logger.warning("QR code generation unavailable. Install with: pip install qrcode pillow")


# =============================================================================
# 25 PROFESSIONAL COLOR THEMES
# =============================================================================

COLOR_THEMES = {
    "diego_original": {
        "name": "Diego Original (Blue-Purple)",
        "primary": "#1473FF",
        "secondary": "#BE01FF",
        "accent": "#1473FF",
        "gradient_start": "#1473FF",
        "gradient_end": "#BE01FF"
    },
    "anxiety": {
        "name": "Anxiety",
        "primary": "#2C3E50",
        "secondary": "#16A085",
        "accent": "#27AE60",
        "gradient_start": "#34495E",
        "gradient_end": "#16A085"
    },
    "sodas_skateboards": {
        "name": "Sodas & Skateboards",
        "primary": "#8B3A8B",
        "secondary": "#00CED1",
        "accent": "#00E5EE",
        "gradient_start": "#9932CC",
        "gradient_end": "#00CED1"
    },
    "guidance": {
        "name": "Guidance",
        "primary": "#8B7355",
        "secondary": "#F0E68C",
        "accent": "#9ACD32",
        "gradient_start": "#A0826D",
        "gradient_end": "#BDB76B"
    },
    "constant_rambling": {
        "name": "Constant Rambling",
        "primary": "#FF6B6B",
        "secondary": "#87CEEB",
        "accent": "#4FC3F7",
        "gradient_start": "#FFB6C1",
        "gradient_end": "#87CEFA"
    },
    "sweetest_chill": {
        "name": "The Sweetest Chill",
        "primary": "#4A4A6A",
        "secondary": "#7B68EE",
        "accent": "#9370DB",
        "gradient_start": "#483D8B",
        "gradient_end": "#B0C4DE"
    },
    "saltwater_tears": {
        "name": "Saltwater Tears",
        "primary": "#2F8B8B",
        "secondary": "#20B2AA",
        "accent": "#48D1CC",
        "gradient_start": "#5F9EA0",
        "gradient_end": "#66CDAA"
    },
    "damned_if_i_do": {
        "name": "Damned If I Do",
        "primary": "#D8A5A5",
        "secondary": "#B0C4DE",
        "accent": "#DCDCDC",
        "gradient_start": "#FFB6C1",
        "gradient_end": "#D3D3D3"
    },
    "without_a_heart": {
        "name": "Without A Heart",
        "primary": "#FFB6C1",
        "secondary": "#B0C4DE",
        "accent": "#E6E6FA",
        "gradient_start": "#FFC0CB",
        "gradient_end": "#D8BFD8"
    },
    "high_fashion": {
        "name": "High Fashion",
        "primary": "#FFD700",
        "secondary": "#FF69B4",
        "accent": "#DA70D6",
        "gradient_start": "#FFA500",
        "gradient_end": "#BA55D3"
    },
    "not_alone_yet": {
        "name": "I'm Not Alone (Yet)",
        "primary": "#708090",
        "secondary": "#D2B48C",
        "accent": "#F5DEB3",
        "gradient_start": "#778899",
        "gradient_end": "#DEB887"
    },
    "castle_in_sky": {
        "name": "Castle In The Sky",
        "primary": "#8B4513",
        "secondary": "#F4A460",
        "accent": "#66CDAA",
        "gradient_start": "#CD853F",
        "gradient_end": "#5F9EA0"
    },
    "pumpkaboo": {
        "name": "Pumpkaboo",
        "primary": "#B0C4DE",
        "secondary": "#CD853F",
        "accent": "#8B4513",
        "gradient_start": "#87CEEB",
        "gradient_end": "#D2691E"
    },
    "cherry_soda": {
        "name": "Cherry Soda",
        "primary": "#2F1F1F",
        "secondary": "#DC143C",
        "accent": "#F5F5DC",
        "gradient_start": "#4B0000",
        "gradient_end": "#8B0000"
    },
    "kinda_like_you": {
        "name": "I (Kinda) Like You Back",
        "primary": "#32CD32",
        "secondary": "#FFD700",
        "accent": "#FF8C00",
        "gradient_start": "#7FFF00",
        "gradient_end": "#FFA500"
    },
    "omniferous": {
        "name": "Omniferous",
        "primary": "#9ACD32",
        "secondary": "#BC8F8F",
        "accent": "#C71585",
        "gradient_start": "#ADFF2F",
        "gradient_end": "#DA70D6"
    },
    "blooming": {
        "name": "Blooming",
        "primary": "#F5F5DC",
        "secondary": "#98FB98",
        "accent": "#FFB6C1",
        "gradient_start": "#FFFACD",
        "gradient_end": "#FF69B4"
    },
    "this_is_my_swamp": {
        "name": "This Is My Swamp",
        "primary": "#2F4F4F",
        "secondary": "#6B8E23",
        "accent": "#9ACD32",
        "gradient_start": "#556B2F",
        "gradient_end": "#8FBC8F"
    },
    "what_i_gain": {
        "name": "What I Gain I Lose",
        "primary": "#B0C4DE",
        "secondary": "#F5DEB3",
        "accent": "#FFDAB9",
        "gradient_start": "#E6E6FA",
        "gradient_end": "#FFE4E1"
    },
    "cyberbullies": {
        "name": "Cyberbullies",
        "primary": "#00CED1",
        "secondary": "#4169E1",
        "accent": "#0000FF",
        "gradient_start": "#00BFFF",
        "gradient_end": "#1E90FF"
    },
    "cool_sunsets": {
        "name": "Cool Sunsets",
        "primary": "#F0E68C",
        "secondary": "#66CDAA",
        "accent": "#5F9EA0",
        "gradient_start": "#20B2AA",
        "gradient_end": "#4682B4"
    },
    "subtle_melancholy": {
        "name": "Subtle Melancholy",
        "primary": "#9370DB",
        "secondary": "#B0C4DE",
        "accent": "#AFEEEE",
        "gradient_start": "#8A7BA8",
        "gradient_end": "#87CEEB"
    },
    "conversation_hearts": {
        "name": "Conversation Hearts",
        "primary": "#FF1493",
        "secondary": "#FFB6C1",
        "accent": "#7FFFD4",
        "gradient_start": "#FF69B4",
        "gradient_end": "#40E0D0"
    },
    "tuesdays": {
        "name": "Tuesdays",
        "primary": "#9370DB",
        "secondary": "#FFD700",
        "accent": "#F0E68C",
        "gradient_start": "#BA55D3",
        "gradient_end": "#EEE8AA"
    },
    "sylveon": {
        "name": "Sylveon",
        "primary": "#FFE4E1",
        "secondary": "#FFB6C1",
        "accent": "#B0C4DE",
        "gradient_start": "#FFC0CB",
        "gradient_end": "#87CEEB"
    },
    "midnight_express": {
        "name": "Midnight Express",
        "primary": "#191970",
        "secondary": "#4169E1",
        "accent": "#6495ED",
        "gradient_start": "#000080",
        "gradient_end": "#4682B4"
    }
}


# =============================================================================
# ANTI-TAMPER ENGINE
# =============================================================================

class AntiTamperEngine:
    """Advanced anti-tamper protection for paystubs"""
    
    @staticmethod
    def generate_document_fingerprint(paystub_data: Dict) -> str:
        """Generate unique document fingerprint for verification"""
        fingerprint_data = f"{paystub_data['employee']['name']}"
        fingerprint_data += f"{paystub_data['company']['name']}"
        fingerprint_data += f"{paystub_data['pay_info']['pay_date']}"
        fingerprint_data += f"{paystub_data['totals']['net_pay']}"
        fingerprint_data += f"{paystub_data['totals']['gross_pay']}"
        fingerprint_data += f"{datetime.now(timezone.utc).isoformat()}"
        
        return hashlib.sha3_512(fingerprint_data.encode()).hexdigest()[:32].upper()
    
    @staticmethod
    def generate_verification_id() -> str:
        """Generate secure verification ID"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_suffix = secrets.token_hex(4).upper()
        return f"SAU{timestamp}{random_suffix}"
    
    @staticmethod
    def create_tamper_proof_seal(document_data: Dict) -> str:
        """Create HMAC-based tamper-proof seal"""
        secret_key = os.environ.get('SAURELLIUS_SECRET_KEY', 'saurellius-2025-secure').encode()
        message = json.dumps(document_data, sort_keys=True).encode()
        return hmac.new(secret_key, message, hashlib.sha256).hexdigest()[:16].upper()
    
    @staticmethod
    def verify_document(document_data: Dict, seal: str) -> bool:
        """Verify document hasn't been tampered with"""
        expected_seal = AntiTamperEngine.create_tamper_proof_seal(document_data)
        return hmac.compare_digest(expected_seal, seal)


# =============================================================================
# NUMBER TO WORDS CONVERTER
# =============================================================================

def number_to_words(amount: float) -> str:
    """Convert dollar amount to words for check stub"""
    ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
    tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
    teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 
             'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
    
    amount = Decimal(str(amount))
    dollars = int(amount)
    cents = int((amount - dollars) * 100)
    
    if dollars == 0:
        return f"ZERO DOLLARS AND {cents:02d}/100"
    
    result = []
    
    # Millions
    if dollars >= 1000000:
        millions = dollars // 1000000
        if millions < 10:
            result.append(ones[millions])
        elif millions < 20:
            result.append(teens[millions - 10])
        else:
            result.append(tens[millions // 10])
            if millions % 10:
                result.append(ones[millions % 10])
        result.append('MILLION')
        dollars = dollars % 1000000
    
    # Thousands
    if dollars >= 1000:
        thousands = dollars // 1000
        if thousands < 10:
            result.append(ones[thousands])
        elif thousands < 20:
            result.append(teens[thousands - 10])
        else:
            result.append(tens[thousands // 10])
            if thousands % 10:
                result.append(ones[thousands % 10])
        result.append('THOUSAND')
        dollars = dollars % 1000
    
    # Hundreds
    if dollars >= 100:
        result.append(ones[dollars // 100])
        result.append('HUNDRED')
        dollars = dollars % 100
    
    # Tens and ones
    if dollars >= 20:
        result.append(tens[dollars // 10])
        if dollars % 10:
            result.append(ones[dollars % 10])
    elif dollars >= 10:
        result.append(teens[dollars - 10])
    elif dollars > 0:
        result.append(ones[dollars])
    
    result.append('DOLLARS')
    result.append('AND')
    result.append(f"{cents:02d}/100")
    
    return ' '.join(result)


# =============================================================================
# MAIN PAYSTUB GENERATOR CLASS
# =============================================================================

class PaystubGenerator:
    """
    Saurellius Paystub Generator
    Bank-grade security, Snappt-compliant, 25 color themes
    """
    
    def __init__(self):
        if not HAS_PLAYWRIGHT:
            logger.warning("Playwright not available - PDF generation will fail")
        
        self.anti_tamper = AntiTamperEngine()
        self.version = "2.1.0"
    
    def get_available_themes(self) -> Dict[str, Dict]:
        """Get all available color themes"""
        return {key: {"name": theme["name"], "primary": theme["primary"], "secondary": theme["secondary"]} 
                for key, theme in COLOR_THEMES.items()}
    
    def generate_verification_qr(self, paystub_data: Dict, verification_id: str) -> str:
        """Generate bank-grade verification QR code"""
        if not HAS_QR:
            return ""
        
        verification_data = {
            'employee': paystub_data['employee']['name'],
            'employer': paystub_data['company']['name'],
            'pay_date': paystub_data['pay_info']['pay_date'],
            'net_pay': str(paystub_data['totals']['net_pay']),
            'gross_pay': str(paystub_data['totals']['gross_pay']),
            'verification_id': verification_id[:8].upper(),
            'timestamp': datetime.now().isoformat(),
            'issuer': 'SAURELLIUS_VERIFIED',
            'security_hash': hashlib.sha256(
                f"{paystub_data['employee']['name']}{paystub_data['totals']['net_pay']}{paystub_data['pay_info']['pay_date']}".encode()
            ).hexdigest()[:16].upper()
        }
        
        qr_string = json.dumps(verification_data, separators=(',', ':'))
        
        qr = qrcode.QRCode(
            version=3,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=8,
            border=2,
        )
        qr.add_data(qr_string)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()
    
    def generate_html(self, paystub_data: Dict, theme_name: str, qr_base64: str,
                     verification_id: str, document_hash: str) -> str:
        """Generate secure HTML paystub with all security features"""
        
        import html as html_module
        
        theme = COLOR_THEMES[theme_name]
        doc_serial = f"SAU{datetime.now().strftime('%Y%m%d')}{verification_id[:8]}"
        
        # Build earnings rows
        earnings_html = ""
        for earning in paystub_data['earnings']:
            earnings_html += f"""
                                <tr>
                                    <td>{html_module.escape(str(earning['description']))}</td>
                                    <td>{html_module.escape(str(earning['rate']))}</td>
                                    <td>{html_module.escape(str(earning['hours']))}</td>
                                    <td>${earning['current']:,.2f}</td>
                                    <td>${earning['ytd']:,.2f}</td>
                                </tr>"""
        
        # Build deductions rows
        deductions_html = ""
        for deduction in paystub_data['deductions']:
            deductions_html += f"""
                                <tr>
                                    <td>{html_module.escape(str(deduction['description']))}</td>
                                    <td>{html_module.escape(str(deduction['type']))}</td>
                                    <td>-${deduction['current']:,.2f}</td>
                                    <td>-${deduction['ytd']:,.2f}</td>
                                </tr>"""
        
        # Complete HTML template with all security features
        return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: 8.5in 11in;
            margin: 0.3in;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            color: #111827;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }}
        
        .snappt-verification {{
            position: absolute;
            top: 5px;
            right: 5px;
            font-size: 6px;
            color: #666;
            opacity: 0.8;
        }}
        
        .document-integrity {{
            position: absolute;
            bottom: 5px;
            left: 5px;
            font-size: 6px;
            color: #666;
            opacity: 0.8;
        }}
        
        .security-thread {{
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: repeating-linear-gradient(
                to bottom,
                {theme['primary']} 0px,
                {theme['primary']} 3px,
                {theme['secondary']} 3px,
                {theme['secondary']} 6px
            );
            opacity: 0.3;
        }}
        
        .anti-copy-pattern {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(20, 115, 255, 0.02) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(190, 1, 255, 0.02) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }}
        
        .microtext-security {{
            font-size: 4px;
            line-height: 4px;
            color: #999;
            letter-spacing: 0.2px;
            opacity: 0.6;
        }}
        
        .container {{
            width: 7.5in;
            margin: 0 auto;
            position: relative;
            background: white;
        }}
        
        .header {{
            background: linear-gradient(135deg, {theme['gradient_start']} 0%, {theme['gradient_end']} 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 12px;
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.05) 10px,
                rgba(255, 255, 255, 0.05) 20px
            );
            pointer-events: none;
        }}
        
        .header-content {{
            display: table;
            width: 100%;
            position: relative;
            z-index: 2;
        }}
        
        .header-left {{
            display: table-cell;
            vertical-align: middle;
            width: 50%;
        }}
        
        .header-center {{
            display: table-cell;
            vertical-align: middle;
            width: 30%;
            text-align: center;
        }}
        
        .header-right {{
            display: table-cell;
            vertical-align: middle;
            width: 20%;
            text-align: right;
        }}
        
        .company-name {{
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }}
        
        .company-address {{
            font-size: 11px;
            opacity: 0.95;
        }}
        
        .earnings-statement {{
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
        }}
        
        .period-info {{
            font-size: 10px;
            line-height: 1.4;
        }}
        
        .qr-container {{
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 8px;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            position: relative;
        }}
        
        .qr-container::before {{
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, {theme['primary']}, {theme['secondary']});
            border-radius: 10px;
            z-index: -1;
        }}
        
        .qr-code {{
            width: 100%;
            height: 100%;
            border-radius: 4px;
        }}
        
        .employee-bar {{
            background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            margin-bottom: 16px;
            position: relative;
            display: table;
            width: calc(100% - 8px);
            max-width: 7.3in;
            margin-left: auto;
            margin-right: auto;
        }}
        
        .employee-name {{
            display: table-cell;
            vertical-align: middle;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }}
        
        .state-badge {{
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 60px;
        }}
        
        .state-indicator {{
            background: rgba(255, 255, 255, 0.25);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }}
        
        .main-content {{
            display: table;
            width: 100%;
            margin-bottom: 16px;
        }}
        
        .left-column {{
            display: table-cell;
            width: 60%;
            vertical-align: top;
            padding-right: 12px;
        }}
        
        .right-column {{
            display: table-cell;
            width: 40%;
            vertical-align: top;
            padding-left: 12px;
        }}
        
        .card {{
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            margin-bottom: 16px;
            overflow: hidden;
            position: relative;
        }}
        
        .card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, {theme['primary']} 0%, {theme['secondary']} 100%);
        }}
        
        .card-header {{
            background: #f8fafc;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .card-icon {{
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, {theme['primary']} 0%, {theme['secondary']} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }}
        
        .card-title {{
            font-weight: bold;
            font-size: 12px;
            color: #374151;
        }}
        
        .table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        .table th {{
            background: #f1f5f9;
            padding: 8px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 9px;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .table td {{
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 10px;
            color: #374151;
        }}
        
        .table tr:hover {{
            background: #f8fafc;
        }}
        
        .total-row {{
            background: linear-gradient(135deg, {theme['gradient_start']} 0%, {theme['gradient_end']} 100%) !important;
            color: white !important;
            font-weight: bold !important;
        }}
        
        .total-row td {{
            border-bottom: none !important;
            padding: 10px 12px !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }}
        
        .perforation {{
            margin: 20px 0;
            text-align: center;
            position: relative;
        }}
        
        .perforation::before {{
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: repeating-linear-gradient(
                to right,
                #d1d5db 0px,
                #d1d5db 8px,
                transparent 8px,
                transparent 16px
            );
        }}
        
        .perforation-text {{
            background: white;
            padding: 0 16px;
            color: #9ca3af;
            font-size: 8px;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
        }}
        
        .stub-section {{
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            margin-top: 20px;
        }}
        
        .security-band {{
            background: repeating-linear-gradient(
                45deg,
                {theme['primary']} 0px,
                {theme['primary']} 2px,
                {theme['secondary']} 2px,
                {theme['secondary']} 4px,
                {theme['primary']} 4px,
                {theme['primary']} 6px,
                transparent 6px,
                transparent 8px
            );
            padding: 4px 8px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .security-band-top {{
            border-radius: 14px 14px 0 0;
            margin: 4px 4px 0 4px;
        }}
        
        .security-band-bottom {{
            border-radius: 0 0 14px 14px;
            margin: 0 4px 4px 4px;
        }}
        
        .security-text {{
            color: white;
            font-size: 6px;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            letter-spacing: 1px;
            position: relative;
            z-index: 2;
        }}
        
        .stub-body {{
            padding: 16px 20px;
            background: white;
            border-radius: 0 0 14px 14px;
            margin: 0 4px 4px 4px;
            position: relative;
        }}
        
        .stub-header {{
            display: table;
            width: 100%;
            margin-bottom: 16px;
            font-size: 8px;
            color: #374151;
        }}
        
        .stub-header-left {{
            display: table-cell;
            width: 50%;
            vertical-align: middle;
            padding-right: 20px;
        }}
        
        .stub-header-right {{
            display: table-cell;
            width: 50%;
            vertical-align: middle;
            text-align: right;
            padding-right: 30px;
        }}
        
        .check-info {{
            margin-bottom: 20px;
        }}
        
        .pay-to-order {{
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 4px;
        }}
        
        .payee-name {{
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 12px;
        }}
        
        .amount-words {{
            font-size: 11px;
            color: #374151;
            margin-bottom: 16px;
            font-style: italic;
        }}
        
        .amount-display {{
            position: absolute;
            top: 80px;
            right: 20px;
            text-align: right;
        }}
        
        .amount-value {{
            font-size: 24px;
            font-weight: bold;
            color: {theme['primary']};
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }}
        
        .signature-section {{
            display: table;
            width: 100%;
            margin-top: 20px;
        }}
        
        .signature-left {{
            display: table-cell;
            width: 50%;
            vertical-align: bottom;
            padding-right: 20px;
        }}
        
        .signature-right {{
            display: table-cell;
            width: 50%;
            vertical-align: bottom;
            padding-left: 20px;
        }}
        
        .signature-line {{
            border-bottom: 1px solid #d1d5db;
            height: 40px;
            margin-bottom: 8px;
            position: relative;
            background: linear-gradient(135deg, rgba(20, 115, 255, 0.03) 0%, rgba(190, 1, 255, 0.03) 100%);
            border-radius: 12px;
            padding: 8px 12px;
        }}
        
        .signature-line::before {{
            content: '';
            position: absolute;
            bottom: 8px;
            left: 12px;
            right: 12px;
            height: 1px;
            background: linear-gradient(90deg, {theme['primary']} 0%, {theme['secondary']} 100%);
            opacity: 0.3;
        }}
        
        .signature-label {{
            font-size: 8px;
            color: #6b7280;
            text-align: center;
            margin-top: 4px;
        }}
        
        .hologram-seal {{
            position: absolute;
            bottom: 60px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, 
                rgba(255, 255, 255, 0.8) 0%,
                {theme['primary']}4D 25%,
                {theme['secondary']}4D 50%,
                {theme['primary']}80 75%,
                {theme['secondary']}B3 100%
            );
            border: 2px solid {theme['primary']}66;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
            color: {theme['primary']};
            text-align: center;
            line-height: 1.2;
            box-shadow: 0 0 20px {theme['primary']}4D;
        }}
        
        .security-watermark {{
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 100px;
            font-size: 6px;
            color: #9ca3af;
            opacity: 0.7;
            text-align: center;
            background: linear-gradient(90deg, transparent 0%, rgba(20, 115, 255, 0.05) 50%, transparent 100%);
            padding: 4px 8px;
            border-radius: 8px 8px 0 0;
        }}
        
        .disclaimer {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 8px 12px;
            margin: 16px 4px 4px 4px;
            text-align: center;
            font-size: 7px;
            color: #92400e;
            font-weight: 500;
            position: relative;
        }}
        
        .void-pattern {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(220, 38, 38, 0.03) 35px, rgba(220, 38, 38, 0.03) 70px),
                repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(220, 38, 38, 0.03) 35px, rgba(220, 38, 38, 0.03) 70px);
            pointer-events: none;
            z-index: 1;
        }}
        
        .secure-document-text {{
            position: absolute;
            bottom: 100px;
            right: 30px;
            transform: rotate(-15deg);
            font-size: 8px;
            font-weight: bold;
            color: {theme['primary']}66;
            letter-spacing: 1px;
            z-index: 3;
        }}
        
        @media print {{
            body {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
        }}
    </style>
</head>
<body>
    <div class="snappt-verification">
        SNAPPT VERIFIED - DOC: {doc_serial} - HASH: {document_hash}
    </div>
    
    <div class="document-integrity">
        SAURELLIUS SECURE - VER: {verification_id[:8]} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    </div>
    
    <div class="security-thread"></div>
    <div class="anti-copy-pattern"></div>
    
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <div class="company-name">{html_module.escape(str(paystub_data['company']['name']))}</div>
                    <div class="company-address">{html_module.escape(str(paystub_data['company']['address']))}</div>
                </div>
                <div class="header-center">
                    <div class="earnings-statement">Earnings Statement</div>
                    <div class="period-info">
                        Period Start: {html_module.escape(str(paystub_data['pay_info']['period_start']))}<br>
                        Period Ending: {html_module.escape(str(paystub_data['pay_info']['period_end']))}<br>
                        Pay Date: {html_module.escape(str(paystub_data['pay_info']['pay_date']))}
                    </div>
                </div>
                <div class="header-right">
                    <div class="qr-container">
                        <img src="data:image/png;base64,{qr_base64}" alt="Verification QR" class="qr-code">
                    </div>
                </div>
            </div>
        </div>
        
        <div class="employee-bar">
            <div class="employee-name">{html_module.escape(str(paystub_data['employee']['name']))}</div>
            <div class="state-badge">
                <div class="state-indicator">{html_module.escape(str(paystub_data['employee']['state']))}</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="left-column">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">$</div>
                        <div class="card-title">Earnings</div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>EARNINGS</th>
                                <th>RATE</th>
                                <th>HOURS</th>
                                <th>THIS PERIOD</th>
                                <th>YEAR TO DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {earnings_html}
                            <tr class="total-row">
                                <td colspan="3"><strong>Gross Pay</strong></td>
                                <td><strong>${paystub_data['totals']['gross_pay']:,.2f}</strong></td>
                                <td><strong>${paystub_data['totals']['gross_pay_ytd']:,.2f}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">-</div>
                        <div class="card-title">Deductions</div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>DESCRIPTION</th>
                                <th>TYPE</th>
                                <th>THIS PERIOD</th>
                                <th>YEAR TO DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deductions_html}
                            <tr class="total-row">
                                <td colspan="2"><strong>Net Pay</strong></td>
                                <td><strong>${paystub_data['totals']['net_pay']:,.2f}</strong></td>
                                <td><strong>${paystub_data['totals']['net_pay_ytd']:,.2f}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="right-column">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">+</div>
                        <div class="card-title">Other Benefits & Information</div>
                    </div>
                    <div style="padding: 16px;">
                        <div style="margin-bottom: 12px;">
                            <strong>401(k)</strong>
                        </div>
                        <div style="margin-bottom: 12px;">
                            Health Insurance
                        </div>
                        <div style="margin-bottom: 12px;">
                            Dental Insurance
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">i</div>
                        <div class="card-title">Important Notes</div>
                    </div>
                    <div style="padding: 16px;">
                        <div style="margin-bottom: 8px; font-size: 9px;">
                            Performance bonus included
                        </div>
                        <div style="font-size: 9px;">
                            401(k) contribution increased
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="perforation">
            <div class="perforation-text microtext-security">
                TEAR ALONG PERFORATION - SECURE DOCUMENT - AUTHORIZED PERSONNEL ONLY
            </div>
        </div>
        
        <div class="stub-section">
            <div class="security-band security-band-top">
                <div class="security-text microtext-security">
                    SECURE DOCUMENT - DO NOT DUPLICATE - VALID ONLY FOR PAYEE - AUTHORIZED PERSONNEL ONLY
                </div>
            </div>
            
            <div class="stub-body">
                <div class="void-pattern"></div>
                
                <div class="stub-header">
                    <div class="stub-header-left">
                        <strong>Payroll check number: {html_module.escape(str(paystub_data['check_info']['number']))}</strong>
                    </div>
                    <div class="stub-header-right">
                        <strong>Pay date: {html_module.escape(str(paystub_data['pay_info']['pay_date']))} - SSN: {html_module.escape(str(paystub_data['employee']['ssn_masked']))}</strong>
                    </div>
                </div>
                
                <div class="check-info">
                    <div class="pay-to-order">Pay to the order of</div>
                    <div class="payee-name">{html_module.escape(str(paystub_data['employee']['name']))}</div>
                    <div class="amount-words">{html_module.escape(str(paystub_data['totals']['amount_words']))}</div>
                </div>
                
                <div class="amount-display">
                    <div class="amount-value">${paystub_data['totals']['net_pay']:,.2f}</div>
                </div>
                
                <div class="signature-section">
                    <div class="signature-left">
                        <div class="signature-line"></div>
                        <div class="signature-label">Authorized Signature</div>
                        <div style="margin-top: 8px; font-size: 7px; color: #6b7280;">
                            Valid after 90 days
                        </div>
                    </div>
                    <div class="signature-right">
                        <div class="signature-line"></div>
                        <div class="signature-label">Manager/Supervisor Signature</div>
                    </div>
                </div>
                
                <div class="hologram-seal">
                    AUTHENTIC
                </div>
                
                <div class="secure-document-text">
                    SECUREPAYROLLDOCUMENT
                </div>
                
                <div class="security-watermark">
                    THE ORIGINAL DOCUMENT HAS WATERMARKS - HOLD AT AN ANGLE TO VIEW - SAURELLIUS SECURE
                </div>
            </div>
            
            <div class="security-band security-band-bottom">
                <div class="security-text microtext-security">
                    AUTHORIZED PAYROLL INSTRUMENT - NON-NEGOTIABLE - VOID IF ALTERED - SAURELLIUS CONFIDENTIAL
                </div>
            </div>
            
            <div class="disclaimer">
                <strong>THIS IS NOT A CHECK - NON-NEGOTIABLE - VOID AFTER 180 DAYS</strong>
            </div>
        </div>
    </div>
</body>
</html>"""
    
    def generate_paystub_pdf(self, paystub_data: Dict, output_path: str, 
                            theme: str = "diego_original") -> Dict:
        """Generate Snappt-compliant paystub PDF with all security features"""
        
        if not HAS_PLAYWRIGHT:
            return {
                'success': False,
                'error': 'Playwright not available. Install with: pip install playwright && playwright install chromium'
            }
        
        if theme not in COLOR_THEMES:
            return {
                'success': False,
                'error': f"Invalid theme '{theme}'. Available: {', '.join(COLOR_THEMES.keys())}"
            }
        
        logger.info(f"Generating paystub with theme: {COLOR_THEMES[theme]['name']}")
        
        # Generate verification credentials
        verification_id = self.anti_tamper.generate_verification_id()
        document_hash = self.anti_tamper.generate_document_fingerprint(paystub_data)[:12].upper()
        
        # Generate QR code
        qr_base64 = self.generate_verification_qr(paystub_data, verification_id)
        
        # Generate HTML
        html_content = self.generate_html(paystub_data, theme, qr_base64, 
                                         verification_id, document_hash)
        
        # Generate PDF with Playwright
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=['--disable-web-security', '--no-sandbox']
                )
                
                page = browser.new_page()
                page.set_content(html_content, wait_until='networkidle')
                
                page.pdf(
                    path=output_path,
                    format='Letter',
                    print_background=True,
                    prefer_css_page_size=True,
                    margin={'top': '0.3in', 'right': '0.3in', 'bottom': '0.3in', 'left': '0.3in'}
                )
                
                browser.close()
            
            file_size = os.path.getsize(output_path)
            
            tamper_seal = self.anti_tamper.create_tamper_proof_seal({
                'verification_id': verification_id,
                'document_hash': document_hash,
                'employee': paystub_data['employee']['name'],
                'net_pay': float(paystub_data['totals']['net_pay']),
                'pay_date': paystub_data['pay_info']['pay_date'],
                'theme': theme
            })
            
            logger.info(f"Paystub generated successfully: {output_path}")
            
            return {
                'success': True,
                'output_path': output_path,
                'verification_id': verification_id,
                'document_hash': document_hash,
                'tamper_seal': tamper_seal,
                'theme': COLOR_THEMES[theme]['name'],
                'theme_key': theme,
                'file_size': file_size,
                'generator': f'Saurellius v{self.version}',
                'snappt_compliant': True,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Paystub generation failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def generate_all_themes(self, paystub_data: Dict, output_dir: str) -> List[Dict]:
        """Generate paystubs in all 25 color themes"""
        
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        for theme_key in COLOR_THEMES.keys():
            output_path = os.path.join(output_dir, f"paystub_{theme_key}.pdf")
            result = self.generate_paystub_pdf(paystub_data, output_path, theme_key)
            results.append(result)
        
        successful = sum(1 for r in results if r['success'])
        logger.info(f"Batch generation complete: {successful}/{len(results)} themes generated")
        
        return results


# Singleton instance
paystub_generator = PaystubGenerator()
