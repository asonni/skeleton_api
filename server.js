const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

process.on('uncaughtException', err => {
  // eslint-disable-next-line no-console
  console.log('UNCAUGHT EXCEPTION! Shutting down...'.red.bold);
  // eslint-disable-next-line no-console
  console.log(err.name, err.message);
  // exit process
  process.exit(1);
});

const ErrorResponse = require('./utils/errorResponse');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Enable colors
colors.enable();

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  })
);

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);

app.all('*', (req, res, next) => {
  next(new ErrorResponse(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Server running ${process.env.NODE_ENV} mode in on port ${PORT}`.yellow.bold
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  // eslint-disable-next-line no-console
  console.log('UNHANDLED REJECTION! Shutting down...'.red.bold);
  // eslint-disable-next-line no-console
  console.log(err.name, err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});
