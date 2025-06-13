import mongoose from 'mongoose';

const ProjectCostSchema = new mongoose.Schema({
  projectKey: { type: String, required: true },
  cost: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ProjectCost', ProjectCostSchema);
