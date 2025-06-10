import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const leaderboardEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  points: Number,
  reason: String,
  category: String, // 'Functional' or 'Behavioral'
}, { _id: false });

const monthlyPointSchema = new mongoose.Schema({
  month: String,
  points: Number,
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  department: String,
  totalPoints: { type: Number, default: 0 },
  rolloverPoints: { type: Number, default: 0 },
  monthlyPoints: [monthlyPointSchema],
  leaderboardEntries: [leaderboardEntrySchema],

  password: {
    type: String,
    required: true, // make it required
  },
  role: {
    type: String,
    default: 'employee',
    enum: ['employee', 'admin'],
  },
});

// Hash password if it's not hashed already
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Default password logic — for when not passed manually
userSchema.pre('validate', function (next) {
  if (!this.password) {
    this.password = 'zenithive123';
  }
  next();
});

export default mongoose.model('User', userSchema);
