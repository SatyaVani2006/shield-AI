const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    preferredLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'te', 'ta', 'fr', 'es', 'de'],
    },

    // IMPORTANT
    // ONLY SUBSCRIBED USERS SHOULD HAVE THIS

    customerId: {
      type: String,
      default: null,
    },
  },

  { timestamps: true }
);

userSchema.pre(
  'save',
  async function hashPassword(next) {

    if (!this.isModified('password')) {
      return next();
    }

    this.password =
      await bcrypt.hash(this.password, 12);

    next();
  }
);

userSchema.methods.comparePassword =
  function comparePassword(candidate) {

    return bcrypt.compare(
      candidate,
      this.password
    );
  };

module.exports =
  mongoose.model('User', userSchema);