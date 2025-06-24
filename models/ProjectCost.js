// models/ProjectCost.js
import mongoose from 'mongoose';

const projectCostSchema = new mongoose.Schema({
  projectKey: {
    type: String,
    required: true,
    unique: true // Ensure only one cost entry per project
  },
  cost: {
    type: Number,
    required: true
  },
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