const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  rollNumber: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['ORDER', 'DONATION'], 
    required: true 
  },
  itemDetails: { 
    type: String, 
    default: 'N/A' // For example: "Official Festival Oversized T-Shirt" or "General Donation"
  },
  amount: { 
    type: Number, 
    required: true,
    min: 1 
  },
  email: {
  type: String,
  trim: true,
  lowercase: true
  },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED'], 
    default: 'PENDING' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);