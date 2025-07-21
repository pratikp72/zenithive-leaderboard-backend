// models/ProjectCost.js
import mongoose from 'mongoose';

const recurringCostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectCostSchema = new mongoose.Schema({
  projectKey: {
    type: String,
    required: true,
    unique: true // Ensure only one cost entry per project
  },
  cost: {
    type: Number,
    required: true,
    default: 0
  },
  recurringCosts: [recurringCostSchema], // Array of recurring costs
  description: {
    type: String,
    default: 'Project cost entry'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ProjectCost = mongoose.model('ProjectCost', projectCostSchema);

export default ProjectCost;