/**
 * EMPLOYEES SERVICE
 * Frontend service for employee management
 */

import api from './api';

// Types
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employee_id: string;
  department?: string;
  position?: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'terminated';
  pay_type: 'hourly' | 'salary';
  pay_rate: number;
  pay_frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  ssn_last_four?: string;
  filing_status?: string;
  allowances?: number;
  created_at: string;
}

export interface CreateEmployeeData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date: string;
  pay_type: 'hourly' | 'salary';
  pay_rate: number;
  pay_frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  ssn_last_four?: string;
  filing_status?: string;
  allowances?: number;
}

// Get all employees
export const getEmployees = async (status?: string): Promise<Employee[]> => {
  const response = await api.get('/api/employees', {
    params: status ? { status } : undefined,
  });
  return response.data.data;
};

// Get employee by ID
export const getEmployeeById = async (id: number): Promise<Employee> => {
  const response = await api.get(`/api/employees/${id}`);
  return response.data.data;
};

// Create employee
export const createEmployee = async (data: CreateEmployeeData): Promise<Employee> => {
  const response = await api.post('/api/employees', data);
  return response.data.data;
};

// Update employee
export const updateEmployee = async (id: number, data: Partial<CreateEmployeeData>): Promise<Employee> => {
  const response = await api.put(`/api/employees/${id}`, data);
  return response.data.data;
};

// Delete employee
export const deleteEmployee = async (id: number): Promise<void> => {
  await api.delete(`/api/employees/${id}`);
};

// Terminate employee
export const terminateEmployee = async (id: number, terminationDate: string, reason?: string): Promise<Employee> => {
  const response = await api.post(`/api/employees/${id}/terminate`, {
    termination_date: terminationDate,
    reason,
  });
  return response.data.data;
};

// Reactivate employee
export const reactivateEmployee = async (id: number): Promise<Employee> => {
  const response = await api.post(`/api/employees/${id}/reactivate`);
  return response.data.data;
};

// Get employee paystub history
export const getEmployeePaystubs = async (id: number): Promise<any[]> => {
  const response = await api.get(`/api/employees/${id}/paystubs`);
  return response.data.data;
};

// Update employee tax info
export const updateTaxInfo = async (id: number, data: {
  filing_status: string;
  allowances: number;
  additional_withholding?: number;
}): Promise<Employee> => {
  const response = await api.put(`/api/employees/${id}/tax-info`, data);
  return response.data.data;
};

// Search employees
export const searchEmployees = async (query: string): Promise<Employee[]> => {
  const response = await api.get('/api/employees/search', {
    params: { q: query },
  });
  return response.data.data;
};

// Get employee count by status
export const getEmployeeStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  terminated: number;
}> => {
  const response = await api.get('/api/employees/stats');
  return response.data.data;
};

export default {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  terminateEmployee,
  reactivateEmployee,
  getEmployeePaystubs,
  updateTaxInfo,
  searchEmployees,
  getEmployeeStats,
};
