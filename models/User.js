import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const leaderboardEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    points: Number,
    reason: String,
    category: String, // 'Functional' or 'Behavioral'
  },
  { _id: false }
);

const monthlyPointSchema = new mongoose.Schema(
  {
    month: String,
    points: Number,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    department: String,
    totalPoints: { type: Number, default: 0 },
    rolloverPoints: { type: Number, default: 0 },
    monthlyPoints: [monthlyPointSchema],
    leaderboardEntries: [leaderboardEntrySchema],

    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'employee',
      enum: ['employee', 'admin'],
    },

    // New Resource Management Fields
    salary: {
      type: Number,
      default: 0,
      min: 0,
    },
    overhead: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },
    monthlyHours: {
      type: Number,
      default: 160, // standard 40 hours/week * 4 weeks
      min: 1,
    },
    effectiveHourlyCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

// Method to calculate effective hourly cost
userSchema.methods.calculateEffectiveHourlyCost = function () {
  if (!this.salary || !this.monthlyHours) {
    return 0;
  }

  // Use parseFloat and proper rounding to avoid floating-point precision issues
  const salary = parseFloat(this.salary);
  const overhead = parseFloat(this.overhead) || 0;
  const monthlyHours = parseFloat(this.monthlyHours);

  const monthlyCost = (salary / 12) * (1 + overhead / 100);
  const effectiveHourlyCost = monthlyCost / monthlyHours;

  // Round to 2 decimal places using a more reliable method
  return Math.round((effectiveHourlyCost + Number.EPSILON) * 100) / 100;
};

// Pre-save middleware to calculate effective hourly cost
userSchema.pre('save', async function (next) {
  // Hash password if it's not hashed already
  if (this.isModified('password') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // Calculate effective hourly cost when salary, overhead, or monthlyHours change
  if (this.isModified('salary') || this.isModified('overhead') || this.isModified('monthlyHours')) {
    this.effectiveHourlyCost = this.calculateEffectiveHourlyCost();
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

// Virtual for formatted salary
userSchema.virtual('formattedSalary').get(function () {
  return this.salary ? `$${this.salary.toLocaleString()}` : '-';
});

// Virtual for formatted overhead
userSchema.virtual('formattedOverhead').get(function () {
  return this.overhead ? `${this.overhead}%` : '-';
});

// Virtual for formatted effective hourly cost
userSchema.virtual('formattedEffectiveHourlyCost').get(function () {
  return this.effectiveHourlyCost ? `$${this.effectiveHourlyCost}` : '-';
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);
