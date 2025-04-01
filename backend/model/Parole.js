import mongoose from "mongoose";

const paroleSchema = new mongoose.Schema({
  number: String,
  date: Date,
  receiverName: String,
  referenceNumber: String,
  prisonerName: String,
  crimeType: String,
  year: Number,
  sentenceReduction: String,
  additionalReduction: String,
  remainingSentence: String,
  startDate: Date,
  endDate: Date,
  paroleDate: Date,
  point: Number,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  inmateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inmate',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  decisionDate: Date,
  decisionReason: String,
  decidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Parole', paroleSchema); 
