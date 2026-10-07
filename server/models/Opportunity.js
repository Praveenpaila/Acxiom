const mongoose = require('mongoose');

const OPPORTUNITY_STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const opportunitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Opportunity Amount must be greater than 0.'],
    },
    stage: {
      type: String,
      enum: OPPORTUNITY_STAGES,
      default: 'Qualification',
      index: true,
    },
    probability: {
      type: Number,
      required: true,
      min: [0, 'Probability must be between 0 and 100.'],
      max: [100, 'Probability must be between 0 and 100.'],
      default: 25,
    },
    expectedCloseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Won', 'Lost'],
      default: 'Open',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Weighted pipeline value = amount * probability / 100
opportunitySchema.virtual('weightedAmount').get(function () {
  if (typeof this.amount === 'number' && typeof this.probability === 'number') {
    return Math.round((this.amount * this.probability) / 100);
  }
  return 0;
});

// Auto-sync status based on stage
opportunitySchema.pre('save', function (next) {
  if (this.stage === 'Won') {
    this.status = 'Won';
    this.probability = 100;
  } else if (this.stage === 'Lost') {
    this.status = 'Lost';
    this.probability = 0;
  } else {
    this.status = 'Open';
  }
  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;
module.exports.OPPORTUNITY_STAGES = OPPORTUNITY_STAGES;
