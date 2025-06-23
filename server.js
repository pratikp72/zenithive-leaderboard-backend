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
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/projects', jiraRoutes);
app.use('/api/project-cost', projectCostRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
