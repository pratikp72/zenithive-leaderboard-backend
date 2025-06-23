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
//   origin: ['http://localhost:3000', 'https://your-frontend-domain.com','*'], // Add your frontend URL
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

// Fixed CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com', // Replace with your actual frontend domain
    // Add your production frontend URL here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add preflight handling for all routes
app.options('*', cors());

app.use(express.json());

// Add a health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/projects', jiraRoutes);
app.use('/api/project-cost', projectCostRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});