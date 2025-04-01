import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const visitorAccountSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [50, "Middle name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: function(v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
        },
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      },
      select: false, // Never show password in queries
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function(v) {
          return validator.isMobilePhone(v);
        },
        message: "Please provide a valid phone number",
      },
    },
    role: {
      type: String,
      enum: ["visitor"],
      default: "visitor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
visitorAccountSchema.index({ email: 1 });
visitorAccountSchema.index({ phone: 1 });
visitorAccountSchema.index({ isActive: 1 });

// Password hashing middleware
visitorAccountSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    
    // Set passwordChangedAt if not new
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token created after
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to check password
visitorAccountSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after token was issued
visitorAccountSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
visitorAccountSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Account locking for too many failed login attempts
visitorAccountSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil > Date.now()) return;

  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }
  
  await this.save();
};

visitorAccountSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Virtual for full name
visitorAccountSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Query middleware to filter out inactive accounts by default
visitorAccountSchema.pre(/^find/, function(next) {
  this.find({ isActive: { $ne: false } });
  next();
});

const VisitorAccount = mongoose.model("VisitorAccount", visitorAccountSchema);

export default VisitorAccount;