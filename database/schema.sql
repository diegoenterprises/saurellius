-- ============================================================================
-- 🗃️ SAURELLIUS CLOUD PAYROLL MANAGEMENT - PostgreSQL Database Schema
-- For AWS RDS PostgreSQL deployment
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'employee',
    worker_type VARCHAR(50) DEFAULT 'w2_employee',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    login_streak INT DEFAULT 0,
    reward_points INT DEFAULT 0,
    total_lifetime_points INT DEFAULT 0,
    reward_tier VARCHAR(50) DEFAULT 'Bronze',
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    ein VARCHAR(20) UNIQUE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'USA',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    pay_frequency VARCHAR(50) DEFAULT 'biweekly',
    company_code VARCHAR(20) UNIQUE,
    owner_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_code ON companies(company_code);
CREATE INDEX idx_companies_owner ON companies(owner_id);

-- ============================================================================
-- EMPLOYEES
-- ============================================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    employee_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    ssn_encrypted BYTEA,
    date_of_birth DATE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    work_state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10),
    job_title VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE NOT NULL,
    termination_date DATE,
    pay_type VARCHAR(50) DEFAULT 'hourly',
    hourly_rate DECIMAL(10,2),
    salary DECIMAL(12,2),
    pay_frequency VARCHAR(50) DEFAULT 'biweekly',
    federal_filing_status VARCHAR(50) DEFAULT 'single',
    federal_allowances INT DEFAULT 0,
    additional_federal_withholding DECIMAL(10,2) DEFAULT 0,
    state_filing_status VARCHAR(50),
    state_allowances INT DEFAULT 0,
    additional_state_withholding DECIMAL(10,2) DEFAULT 0,
    local_jurisdiction VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'full-time',
    status VARCHAR(50) DEFAULT 'active',
    preferred_theme VARCHAR(50) DEFAULT 'diego_original',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(status);

-- ============================================================================
-- PAYSTUBS
-- ============================================================================

CREATE TABLE paystubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id VARCHAR(100) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    employee_id UUID REFERENCES employees(id) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    regular_hours DECIMAL(8,2) DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    regular_pay DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    commission DECIMAL(12,2) DEFAULT 0,
    gross_pay DECIMAL(12,2) NOT NULL,
    federal_tax DECIMAL(10,2) DEFAULT 0,
    social_security DECIMAL(10,2) DEFAULT 0,
    medicare DECIMAL(10,2) DEFAULT 0,
    state_tax DECIMAL(10,2) DEFAULT 0,
    local_tax DECIMAL(10,2) DEFAULT 0,
    sdi DECIMAL(10,2) DEFAULT 0,
    health_insurance DECIMAL(10,2) DEFAULT 0,
    dental_insurance DECIMAL(10,2) DEFAULT 0,
    vision_insurance DECIMAL(10,2) DEFAULT 0,
    retirement_401k DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL,
    net_pay DECIMAL(12,2) NOT NULL,
    ytd_gross DECIMAL(14,2) DEFAULT 0,
    ytd_federal_tax DECIMAL(12,2) DEFAULT 0,
    ytd_social_security DECIMAL(12,2) DEFAULT 0,
    ytd_medicare DECIMAL(12,2) DEFAULT 0,
    ytd_state_tax DECIMAL(12,2) DEFAULT 0,
    ytd_net DECIMAL(14,2) DEFAULT 0,
    vacation_used DECIMAL(8,2) DEFAULT 0,
    sick_used DECIMAL(8,2) DEFAULT 0,
    personal_used DECIMAL(8,2) DEFAULT 0,
    vacation_balance DECIMAL(8,2) DEFAULT 0,
    sick_balance DECIMAL(8,2) DEFAULT 0,
    personal_balance DECIMAL(8,2) DEFAULT 0,
    theme VARCHAR(50) DEFAULT 'diego_original',
    pdf_url VARCHAR(500),
    document_hash VARCHAR(128),
    status VARCHAR(50) DEFAULT 'generated',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paystubs_company ON paystubs(company_id);
CREATE INDEX idx_paystubs_employee ON paystubs(employee_id);
CREATE INDEX idx_paystubs_pay_date ON paystubs(pay_date);
CREATE INDEX idx_paystubs_verification ON paystubs(verification_id);

-- ============================================================================
-- TIME ENTRIES
-- ============================================================================

CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    break_start TIMESTAMP,
    break_end TIMESTAMP,
    total_break_minutes INT DEFAULT 0,
    total_hours DECIMAL(6,2),
    status VARCHAR(50) DEFAULT 'active',
    location VARCHAR(255),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);

-- ============================================================================
-- SHIFT SWAP REQUESTS (INTERCHANGE)
-- ============================================================================

CREATE TABLE shift_swaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_employee_id UUID REFERENCES employees(id) NOT NULL,
    requesting_employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    swap_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    manager_approved_by UUID REFERENCES users(id),
    manager_approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shift_swaps_company ON shift_swaps(company_id);
CREATE INDEX idx_shift_swaps_status ON shift_swaps(status);

-- ============================================================================
-- PTO REQUESTS
-- ============================================================================

CREATE TABLE pto_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    pto_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hours_requested DECIMAL(8,2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pto_requests_employee ON pto_requests(employee_id);
CREATE INDEX idx_pto_requests_status ON pto_requests(status);

-- ============================================================================
-- REWARDS & ACHIEVEMENTS
-- ============================================================================

CREATE TABLE reward_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    points INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reward_history_user ON reward_history(user_id);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    company_id UUID REFERENCES companies(id),
    plan VARCHAR(50) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    paystubs_used INT DEFAULT 0,
    paystubs_limit INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================================================
-- MESSAGES (Internal messaging)
-- ============================================================================

CREATE TABLE message_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name VARCHAR(100),
    type VARCHAR(50) DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES message_channels(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES message_channels(id) NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================================================
-- STORED FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_swaps_updated_at BEFORE UPDATE ON shift_swaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pto_requests_updated_at BEFORE UPDATE ON pto_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA FOR SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@saurellius.com', '$2b$12$example', 'System', 'Admin', 'admin', true);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW v_employee_summary AS
SELECT 
    e.id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.email,
    e.job_title,
    e.department,
    e.work_state,
    e.pay_type,
    e.hourly_rate,
    e.salary,
    e.status,
    c.name AS company_name,
    COUNT(p.id) AS total_paystubs,
    COALESCE(SUM(p.gross_pay), 0) AS ytd_gross
FROM employees e
JOIN companies c ON e.company_id = c.id
LEFT JOIN paystubs p ON e.id = p.employee_id AND EXTRACT(YEAR FROM p.pay_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY e.id, c.name;

CREATE VIEW v_dashboard_stats AS
SELECT 
    c.id AS company_id,
    COUNT(DISTINCT e.id) AS active_employees,
    COUNT(DISTINCT p.id) AS total_paystubs,
    COALESCE(SUM(p.gross_pay), 0) AS ytd_gross_total,
    COUNT(DISTINCT CASE WHEN p.pay_date >= DATE_TRUNC('month', CURRENT_DATE) THEN p.id END) AS paystubs_this_month
FROM companies c
LEFT JOIN employees e ON c.id = e.company_id AND e.status = 'active'
LEFT JOIN paystubs p ON c.id = p.company_id AND EXTRACT(YEAR FROM p.pay_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY c.id;
