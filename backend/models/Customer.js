const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({

  customerId: {
    type: String,
    required: true,
    unique: true,
  },

  name: String,

  email: String,

  company: String,

  plan: String,

  storageUsedGB: Number,

  totalStorageGB: Number,

  sessionsCompleted: Number,

  logsUploaded: Number,

  apiRequestsRemaining: Number,

  retentionDays: Number,

  lastLogin: Date,

}, {
  timestamps: true,
});

module.exports =
  mongoose.model(
    'Customer',
    customerSchema
  );