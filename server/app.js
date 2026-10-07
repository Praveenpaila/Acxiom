const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (configure CSP to allow Swagger UI inline assets)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS locked to client origin
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing with safe size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'acxiom_crm_cookie_secret'));

// Prevent NoSQL query injection
app.use(mongoSanitize());

// Interactive API Documentation (Swagger / OpenAPI 3.0)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerSpec');

app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'AcxiomCRM API Documentation',
    customCss: '.swagger-ui .topbar { background-color: #0f172a; } .swagger-ui .info { margin: 20px 0; }',
  })
);

// Mount API routes
app.use('/api', apiRoutes);

// Fallthrough 404 and global error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
