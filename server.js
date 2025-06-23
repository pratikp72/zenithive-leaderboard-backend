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

// Updated CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://your-frontend-domain.com',
    // Add your actual frontend domain here
    '*' // Temporarily allow all origins for testing
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Add a root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Backend API is running',
    endpoints: ['/api/users', '/api/points', '/api/projects', '/api/project-cost']
  });
});

app.use('/api/users', userRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/projects', jiraRoutes);
app.use('/api/project-cost', projectCostRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});