// models/ProjectCost.js
import mongoose from 'mongoose';

const projectCostSchema = new mongoose.Schema({
  projectKey: {
    type: String,
    required: true,
    index: true // Add index for better query performance
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

// Create compound index for efficient queries
projectCostSchema.index({ projectKey: 1, createdAt: -1 });

const ProjectCost = mongoose.model('ProjectCost', projectCostSchema);

export default ProjectCost;