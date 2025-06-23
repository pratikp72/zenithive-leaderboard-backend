// /* eslint-disable no-undef */
// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import { connectDB } from './config/db.js';
// import userRoutes from './routes/userRoutes.js';
// import pointRoutes from './routes/pointRoutes.js';
// import jiraRoutes from './routes/jiraRoutes.js';
// import projectCostRoutes from './routes/projectCostRoutes.js';

// dotenv.config();
// connectDB();

// const app = express();
// app.use(cors({
//   origin: ['http://localhost:3000', 'https://your-frontend-domain.com','*'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
// app.use(express.json());



// app.use('/api/users', userRoutes);
// app.use('/api/points', pointRoutes);
// app.use('/api/projects', jiraRoutes);
// app.use('/api/project-cost', projectCostRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



/* eslint-disable no-undef */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import pointRoutes from './routes/pointRoutes.js';
import jiraRoutes from './routes/jiraRoutes.js';
import projectCostRoutes from './routes/projectCostRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Improved CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-frontend-domain.com',
      // Add your actual frontend domain here
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors());

app.use(express.json());

// Add a root route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!', timestamp: new Date().toISOString() });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Load all routes
console.log('Loading routes...');

app.use('/api/users', userRoutes);
console.log('User routes loaded');

app.use('/api/points', pointRoutes);
console.log('Point routes loaded');

app.use('/api/projects', jiraRoutes);
console.log('Jira routes loaded');

app.use('/api/project-cost', projectCostRoutes);
console.log('Project cost routes loaded');

console.log('All routes loaded successfully');

// Add 404 handler for debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/users/auth',
      'GET /api/points',
      'GET /api/projects',
      'GET /api/project-cost'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));