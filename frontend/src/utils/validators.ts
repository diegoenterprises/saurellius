/**
 * SAURELLIUS VALIDATORS
 * Input validation utility functions
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

export const isValidSSN = (ssn: string): boolean => {
  const cleaned = ssn.replace(/\D/g, '');
  return cleaned.length === 9;
};

export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  return { valid: errors.length === 0, errors };
};

export const isValidZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

export const isValidRoutingNumber = (routing: string): boolean => {
  const cleaned = routing.replace(/\D/g, '');
  return cleaned.length === 9;
};

export const isValidAccountNumber = (account: string): boolean => {
  const cleaned = account.replace(/\D/g, '');
  return cleaned.length >= 4 && cleaned.length <= 17;
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isValidEIN = (ein: string): boolean => {
  const cleaned = ein.replace(/\D/g, '');
  return cleaned.length === 9;
};

export const isEmpty = (value: string | null | undefined): boolean => {
  return value === null || value === undefined || value.trim() === '';
};

export const isNumeric = (value: string): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
};
