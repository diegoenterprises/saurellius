/**
 * Email Service
 * API calls for email functionality
 */

import api from './api';

export interface SendPaystubEmailParams {
  recipient: string;
  employee_name: string;
  pay_date: string;
  paystub_url?: string;
}

export interface SendWelcomeEmailParams {
  recipient: string;
  user_name: string;
}

export const emailService = {
  /**
   * Send paystub notification email
   */
  sendPaystubNotification: async (params: SendPaystubEmailParams): Promise<boolean> => {
    try {
      const response = await api.post('/api/email/send-paystub', params);
      return response.data.success;
    } catch (error) {
      console.error('Send paystub email error:', error);
      return false;
    }
  },

  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail: async (params: SendWelcomeEmailParams): Promise<boolean> => {
    try {
      const response = await api.post('/api/email/send-welcome', params);
      return response.data.success;
    } catch (error) {
      console.error('Send welcome email error:', error);
      return false;
    }
  },

  /**
   * Request password reset email
   */
  requestPasswordReset: async (email: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/email/password-reset', { email });
      return response.data.success;
    } catch (error) {
      console.error('Password reset request error:', error);
      return false;
    }
  },

  /**
   * Send subscription confirmation email
   */
  sendSubscriptionConfirmation: async (
    planName: string,
    monthlyPrice: number
  ): Promise<boolean> => {
    try {
      const response = await api.post('/api/email/subscription-confirmed', {
        plan_name: planName,
        monthly_price: monthlyPrice
      });
      return response.data.success;
    } catch (error) {
      console.error('Subscription email error:', error);
      return false;
    }
  },

  /**
   * Send test email
   */
  sendTestEmail: async (): Promise<boolean> => {
    try {
      const response = await api.post('/api/email/test');
      return response.data.success;
    } catch (error) {
      console.error('Test email error:', error);
      return false;
    }
  },
};

export default emailService;
