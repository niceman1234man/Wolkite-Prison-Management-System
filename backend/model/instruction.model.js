import mongoose from "mongoose";
const InstructionSchema=new mongoose.Schema({
    // Case information
    courtCaseNumber:{
        type: String,
        required: true
    },
    judgeName:{
        type: String,
        required: true
    },
    prisonName:{
        type: String,
        required: true
    },
    verdict:{
        type: String,
        required: true
    },
    instructions:{
        type: String,
        required: true
    },
    hearingDate: {
        type: Date,
        required: true
    },
    effectiveDate:{
        type: Date,
        required: true
    },
    sendDate:{
        type: Date,
        required: true
    },
    caseType: {
        type: String,
        required: true
    },
    sentenceYear: {
        type: Number,
        required: true
    },
    
    // Personal information
    firstName: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        default: function() {
            return `${this.firstName} ${this.middleName} ${this.lastName}`.trim();
        }
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    birthdate: {
        type: Date,
        required: true
    },
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed'],
        required: true
    },
    nationality: {
        type: String,
        default: 'Ethiopian',
        required: true
    },
    educationLevel: {
        type: String,
        enum: ['none', 'primary', 'secondary', 'diploma', 'degree', 'masters', 'doctorate'],
        required: true
    },
    occupation: {
        type: String,
        required: true
    },
    
    // Birth address
    birthRegion: {
        type: String,
        required: true
    },
    birthZone: {
        type: String,
        required: true
    },
    birthWoreda: {
        type: String,
        required: true
    },
    birthKebele: {
        type: String,
        required: true
    },
    
    // Current address
    currentRegion: {
        type: String,
        required: true
    },
    currentZone: {
        type: String,
        required: true
    },
    currentWoreda: {
        type: String,
        required: true
    },
    currentKebele: {
        type: String,
        required: true
    },
    
    // Document paths
    signature: {
        type: String
    },
    attachment: {
        type: String,
        required: true
    }
    
},{timestamps:true});

export const Instruction=mongoose.model('Instruction',InstructionSchema);

