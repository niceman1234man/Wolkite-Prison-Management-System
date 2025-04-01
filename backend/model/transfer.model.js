import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
    inmateId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fromPrison: { type: String, required: true },
    toPrison: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    inmateData: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        middleName: { type: String },
        dateOfBirth: { type: Date },
        gender: { type: String },
        crime: { type: String },
        sentenceStart: { type: Date },
        sentenceEnd: { type: Date },
        paroleEligibility: { type: Boolean },
        medicalConditions: { type: String },
        riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
        specialRequirements: { type: String },
        intakeDate: { type: Date },
        arrestingOfficer: { type: String },
        holdingCell: { type: String },
        documents: [{ type: String }],
        photo: { type: String }
    },
    requestDetails: {
        requestDate: { type: Date, default: Date.now },
        requestedBy: {
            role: { type: String, required: true },
            prison: { type: String, required: true }
        },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        securityReview: {
            status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            reviewDate: { type: Date },
            reviewedBy: { type: String },
            rejectionReason: { type: String }
        }
    }
}, { timestamps: true });

export const Transfer = mongoose.model('Transfer', transferSchema);
