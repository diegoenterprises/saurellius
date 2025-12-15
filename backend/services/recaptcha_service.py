"""
RECAPTCHA SERVICE
Google reCAPTCHA verification service
"""

import os
import requests
from flask import current_app


class RecaptchaService:
    """Service for verifying Google reCAPTCHA tokens."""
    
    VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
    
    def __init__(self):
        self.secret_key = os.environ.get('RECAPTCHA_SECRET_KEY', '')
    
    def verify(self, token: str, remote_ip: str = None) -> dict:
        """
        Verify a reCAPTCHA token with Google's API.
        
        Args:
            token: The reCAPTCHA response token from the client
            remote_ip: Optional client IP address
            
        Returns:
            dict with 'success' boolean and optional 'error' message
        """
        if not self.secret_key:
            current_app.logger.warning('RECAPTCHA_SECRET_KEY not configured')
            # Allow bypass in development if not configured
            if current_app.debug:
                return {'success': True, 'score': 1.0}
            return {'success': False, 'error': 'reCAPTCHA not configured'}
        
        if not token:
            return {'success': False, 'error': 'reCAPTCHA token is required'}
        
        try:
            payload = {
                'secret': self.secret_key,
                'response': token
            }
            
            if remote_ip:
                payload['remoteip'] = remote_ip
            
            response = requests.post(self.VERIFY_URL, data=payload, timeout=10)
            result = response.json()
            
            if result.get('success'):
                # For reCAPTCHA v3, check score (0.0 - 1.0)
                score = result.get('score', 1.0)
                if score < 0.5:  # Threshold for suspicious activity
                    return {
                        'success': False,
                        'error': 'reCAPTCHA verification failed - suspicious activity detected',
                        'score': score
                    }
                return {'success': True, 'score': score}
            else:
                error_codes = result.get('error-codes', [])
                return {
                    'success': False,
                    'error': f'reCAPTCHA verification failed: {", ".join(error_codes)}'
                }
                
        except requests.exceptions.Timeout:
            current_app.logger.error('reCAPTCHA verification timeout')
            return {'success': False, 'error': 'reCAPTCHA verification timeout'}
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f'reCAPTCHA verification error: {e}')
            return {'success': False, 'error': 'reCAPTCHA verification failed'}
        except Exception as e:
            current_app.logger.error(f'Unexpected reCAPTCHA error: {e}')
            return {'success': False, 'error': 'reCAPTCHA verification error'}


# Singleton instance
recaptcha_service = RecaptchaService()
