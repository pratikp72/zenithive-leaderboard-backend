// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// const leaderboardEntrySchema = new mongoose.Schema(
//   {
//     date: { type: Date, default: Date.now },
//     points: Number,
//     reason: String,
//     category: String, // 'Functional' or 'Behavioral'
//   },
//   { _id: false }
// );

// const monthlyPointSchema = new mongoose.Schema(
//   {
//     month: String,
//     points: Number,
//   },
//   { _id: false }
// );

// const userSchema = new mongoose.Schema(
//   {
//     name: String,
//     email: String,
//     department: String,
//     totalPoints: { type: Number, default: 0 },
//     rolloverPoints: { type: Number, default: 0 },
//     monthlyPoints: [monthlyPointSchema],
//     leaderboardEntries: [leaderboardEntrySchema],

//     password: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       default: 'employee',
//       enum: ['employee', 'admin'],
//     },

//     // New Resource Management Fields
//     salary: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     overhead: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 100, // percentage
//     },
//     monthlyHours: {
//       type: Number,
//       default: 160, // standard 40 hours/week * 4 weeks
//       min: 1,
//     },
//     effectiveHourlyCost: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//   },
//   {
//     timestamps: true, // adds createdAt and updatedAt fields
//   }
// );

// // Method to calculate effective hourly cost
// userSchema.methods.calculateEffectiveHourlyCost = function () {
//   if (!this.salary || !this.monthlyHours) {
//     return 0;
//   }

//   // Use parseFloat and proper rounding to avoid floating-point precision issues
//   const salary = parseFloat(this.salary);
//   const overhead = parseFloat(this.overhead) || 0;
//   const monthlyHours = parseFloat(this.monthlyHours);

//   const monthlyCost = (salary / 12) * (1 + overhead / 100);
//   const effectiveHourlyCost = monthlyCost / monthlyHours;

//   // Round to 2 decimal places using a more reliable method
//   return Math.round((effectiveHourlyCost + Number.EPSILON) * 100) / 100;
// };

// // Pre-save middleware to calculate effective hourly cost
// userSchema.pre('save', async function (next) {
//   // Hash password if it's not hashed already
//   if (this.isModified('password') && !this.password.startsWith('$2b$')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }

//   // Calculate effective hourly cost when salary, overhead, or monthlyHours change
//   if (this.isModified('salary') || this.isModified('overhead') || this.isModified('monthlyHours')) {
//     this.effectiveHourlyCost = this.calculateEffectiveHourlyCost();
//   }

//   next();
// });

// // Default password logic — for when not passed manually
// userSchema.pre('validate', function (next) {
//   if (!this.password) {
//     this.password = 'zenithive123';
//   }
//   next();
// });

// // Virtual for formatted salary
// userSchema.virtual('formattedSalary').get(function () {
//   return this.salary ? `$${this.salary.toLocaleString()}` : '-';
// });

// // Virtual for formatted overhead
// userSchema.virtual('formattedOverhead').get(function () {
//   return this.overhead ? `${this.overhead}%` : '-';
// });

// // Virtual for formatted effective hourly cost
// userSchema.virtual('formattedEffectiveHourlyCost').get(function () {
//   return this.effectiveHourlyCost ? `$${this.effectiveHourlyCost}` : '-';
// });

// // Ensure virtuals are included in JSON output
// userSchema.set('toJSON', { virtuals: true });
// userSchema.set('toObject', { virtuals: true });

// export default mongoose.model('User', userSchema);




import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const leaderboardEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    points: Number,
    reason: String,
    category: String,
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email) {
          // Basic email validation regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
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
      enum: ['employee', 'Admin'],
    },

    // JIRA Integration Field
    accountId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique non-null values
      index: true, // Add index for faster queries
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

// Add compound index for better query performance
userSchema.index({ email: 1, accountId: 1 });

// Method to calculate effective hourly cost - FIXED VERSION
userSchema.methods.calculateEffectiveHourlyCost = function () {
  if (!this.salary || !this.monthlyHours) {
    return 0;
  }

  // Use parseFloat and proper rounding to avoid floating-point precision issues
  const salaryNum = parseFloat(this.salary); // treating as monthly salary (not annual)
  const overheadNum = parseFloat(this.overhead) || 0;
  const monthlyHoursNum = parseFloat(this.monthlyHours);

  // FIXED: Don't divide by 12 - salary is already monthly
  const monthlyCost = salaryNum * (1 + overheadNum / 100);
  const effectiveHourlyCost = monthlyCost / monthlyHoursNum;

  // Round to 2 decimal places using a more reliable method
  const rounded = Math.round((effectiveHourlyCost + Number.EPSILON) * 100) / 100;
  
  console.log('Backend calculation:', {
    salary: salaryNum,
    overhead: overheadNum,
    monthlyHours: monthlyHoursNum,
    monthlyCost,
    effectiveHourlyCost,
    rounded
  });

  return rounded;
};

// Pre-save middleware to handle email uniqueness and calculate effective hourly cost
userSchema.pre('save', async function (next) {
  try {
    // Check for duplicate email if email is being modified
    if (this.isModified('email')) {
      const existingUser = await this.constructor.findOne({
        email: this.email,
        _id: { $ne: this._id } // Exclude current document when updating
      });
      
      if (existingUser) {
        const error = new Error('Email already exists');
        error.code = 11000; // MongoDB duplicate key error code
        throw error;
      }
    }

    // Hash password if it's not hashed already
    if (this.isModified('password') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Calculate effective hourly cost when salary, overhead, or monthlyHours change
    if (this.isModified('salary') || this.isModified('overhead') || this.isModified('monthlyHours')) {
      console.log('Recalculating effective hourly cost for user:', this.name);
      console.log('Input values:', {
        salary: this.salary,
        overhead: this.overhead,
        monthlyHours: this.monthlyHours
      });
      
      this.effectiveHourlyCost = this.calculateEffectiveHourlyCost();
      
      console.log('Calculated effective hourly cost:', this.effectiveHourlyCost);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Default password logic — for when not passed manually
userSchema.pre('validate', function (next) {
  if (!this.password) {
    this.password = 'zenithive123';
  }
  next();
});

// Handle duplicate key errors
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.keyPattern && error.keyPattern.email) {
      next(new Error('Email already exists'));
    } else if (error.keyPattern && error.keyPattern.accountId) {
      next(new Error('JIRA Account ID already exists'));
    } else {
      next(new Error('Duplicate value error'));
    }
  } else {
    next(error);
  }
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