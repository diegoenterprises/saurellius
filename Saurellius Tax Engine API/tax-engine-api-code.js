// server.js - Main entry point for the Saurellius Tax Engine API

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const { authenticate } = require('./middleware/auth');
const taxDatabase = require('./database/taxDatabase');

// Import route handlers
const calculationRoutes = require('./routes/calculation');
const locationRoutes = require('./routes/locations');
const jurisdictionRoutes = require('./routes/jurisdictions');
const taxRateRoutes = require('./routes/taxRates');
const w4Routes = require('./routes/w4');
const multistateRoutes = require('./routes/multistate');
const taxUpdateRoutes = require('./routes/taxUpdates');
const employeeRoutes = require('./routes/employees');
const reciprocityRoutes = require('./routes/reciprocity');
const webhookRoutes = require('./routes/webhooks');

// Initialize the API server
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize tax database and load tax data
taxDatabase.initialize()
  .then(() => {
    console.log('Tax database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize tax database:', err);
    process.exit(1);
  });

// Apply security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/v1/', apiLimiter);

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// API documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authenticate all API requests except docs
app.use('/v1/', authenticate);

// Register route handlers
app.use('/v1/calculate', calculationRoutes);
app.use('/v1/locations', locationRoutes);
app.use('/v1/jurisdictions', jurisdictionRoutes);
app.use('/v1/taxes/rates', taxRateRoutes);
app.use('/v1/w4', w4Routes);
app.use('/v1/multistate', multistateRoutes);
app.use('/v1/taxes/updates', taxUpdateRoutes);
app.use('/v1/employees', employeeRoutes);
app.use('/v1/reciprocity', reciprocityRoutes);
app.use('/v1/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Saurellius Tax Engine API',
    version: '1.0.0',
    documentation: '/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'internal_error',
      message: err.message || 'An unexpected error occurred',
      details: err.details || null
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Saurellius Tax Engine API running on port ${PORT}`);
});

module.exports = app;
