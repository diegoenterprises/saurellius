/**
 * 👥 EMPLOYEES SLICE
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeeAPI } from '../../services/api';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  work_state: string;
  hire_date: string;
  pay_type: string;
  hourly_rate?: number;
  salary?: number;
  status: string;
}

interface EmployeesState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number };
}

const initialState: EmployeesState = {
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0 },
};

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (params: { page?: number; limit?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await employeeAPI.getAll(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load employees');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await employeeAPI.create(data);
      return response.employee;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await employeeAPI.update(id, data);
      return response.employee;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id: string, { rejectWithValue }) => {
    try {
      await employeeAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete employee');
    }
  }
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setSelectedEmployee: (state, action) => {
      state.selectedEmployee = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchEmployees.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchEmployees.fulfilled, (state, action) => {
      state.isLoading = false;
      state.employees = action.payload.employees;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchEmployees.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    builder.addCase(createEmployee.fulfilled, (state, action) => {
      state.employees.unshift(action.payload);
    });
    builder.addCase(updateEmployee.fulfilled, (state, action) => {
      const index = state.employees.findIndex(e => e.id === action.payload.id);
      if (index !== -1) state.employees[index] = action.payload;
    });
    builder.addCase(deleteEmployee.fulfilled, (state, action) => {
      state.employees = state.employees.filter(e => e.id !== action.payload);
    });
  },
});

export const { setSelectedEmployee, clearError } = employeesSlice.actions;
export default employeesSlice.reducer;
