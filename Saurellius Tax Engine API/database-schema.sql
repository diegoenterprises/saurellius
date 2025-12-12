-- database/schema.sql - Database schema for Saurellius Tax Engine

-- Create jurisdictions table
CREATE TABLE jurisdictions (
  jurisdiction_id VARCHAR(50) PRIMARY KEY,
  jurisdiction_name VARCHAR(255) NOT NULL,
  jurisdiction_type VARCHAR(50) NOT NULL,
  jurisdiction_code VARCHAR(50) NOT NULL,
  state_code VARCHAR(2),
  parent_jurisdiction_id VARCHAR(50),
  residence_based TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_jurisdiction_id) REFERENCES jurisdictions(jurisdiction_id)
);

-- Create tax_rates table
CREATE TABLE tax_rates (
  tax_id VARCHAR(50) NOT NULL,
  jurisdiction_id VARCHAR(50) NOT NULL,
  tax_name VARCHAR(255) NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  rate DECIMAL(10, 6),
  flat_amount DECIMAL(10, 2),
  minimum_wage DECIMAL(12, 2),
  maximum_wage DECIMAL(12, 2),
  effective_date DATE NOT NULL,
  expiration_date DATE,
  brackets JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tax_id, effective_date),
  FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(jurisdiction_id)
);

-- Create tax_updates table
CREATE TABLE tax_updates (
  update_id INT AUTO_INCREMENT PRIMARY KEY,
  tax_id VARCHAR(50) NOT NULL,
  update_type ENUM('new', 'modified', 'expired') NOT NULL,
  previous_rate DECIMAL(10, 6),
  documentation_url VARCHAR(255),
  summary TEXT,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tax_id) REFERENCES tax_rates(tax_id)
);

-- Create locations table
CREATE TABLE locations (
  location_id INT AUTO_INCREMENT PRIMARY KEY,
  state_id VARCHAR(2) NOT NULL,
  county_id VARCHAR(3) NOT NULL,
  feature_id VARCHAR(8) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (state_id, county_id, feature_id)
);

-- Create jurisdiction_locations table
CREATE TABLE jurisdiction_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jurisdiction_id VARCHAR(50) NOT NULL,
  state_id VARCHAR(2) NOT NULL,
  county_id VARCHAR(3),
  feature_id VARCHAR(8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(jurisdiction_id)
);

-- Create jurisdiction_boundaries table
CREATE TABLE jurisdiction_boundaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jurisdiction_id VARCHAR(50) NOT NULL,
  boundary GEOMETRY NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(jurisdiction_id),
  SPATIAL INDEX (boundary)
);

-- Create state_constants table
CREATE TABLE state_constants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  state_code VARCHAR(2) NOT NULL,
  constant_name VARCHAR(50) NOT NULL,
  constant_value DECIMAL(15, 6) NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (state_code, constant_name, effective_date)
);

-- Create reciprocity_agreements table
CREATE TABLE reciprocity_agreements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  home_state VARCHAR(2) NOT NULL,
  work_state VARCHAR(2) NOT NULL,
  description TEXT NOT NULL,
  conditions JSON,
  forms JSON,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (home_state, work_state, effective_date)
);

-- Create api_versions table
CREATE TABLE api_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  release_date DATE NOT NULL,
  release_notes TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (version)
);

-- Create address_cache table
CREATE TABLE address_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL,
  result JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (cache_key)
);

-- Create api_keys table
CREATE TABLE api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(64) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  rate_limit INT DEFAULT 100,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (api_key)
);

-- Create webhooks table
CREATE TABLE webhooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  secret_key VARCHAR(64) NOT NULL,
  events JSON NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES api_keys(id)
);

-- Create webhook_logs table
CREATE TABLE webhook_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  webhook_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  response_code INT,
  response_message TEXT,
  attempt_count INT DEFAULT 1,
  succeeded TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id)
);

-- Create calculation_logs table
CREATE TABLE calculation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  calculation_id VARCHAR(36) NOT NULL,
  client_id INT,
  request_data JSON NOT NULL,
  response_data JSON NOT NULL,
  execution_time DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (calculation_id),
  FOREIGN KEY (client_id) REFERENCES api_keys(id)
);

-- Create error_logs table
CREATE TABLE error_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_code VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  client_id INT,
  request_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES api_keys(id)
);
