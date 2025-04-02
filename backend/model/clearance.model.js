import mongoose from "mongoose";
const clearanceSchema=new mongoose.Schema({
    date:{
        type: Date,
        required: true
    },
    registrar:{
        type: String,
        required: true
    },
    inmate:{
        type: String,
        required: true
    },
    reason:{
        type: String,
        required: true
    },
    remark:{
        type: String,
        required: true
    },
    sign:{
        type: String
    },
    clearanceId:{
        type: String,
        unique: true,
        required: true
    },
    propertyStatus:{
        type: String,
        enum: ["Returned", "Partial", "Outstanding"],
        default: "Returned"
    },
    fineStatus:{
        type: String,
        enum: ["No Outstanding", "Partial", "Outstanding"],
        default: "No Outstanding"
    },
    medicalStatus:{
        type: String,
        enum: ["Cleared", "Pending", "Treatment"],
        default: "Cleared"
    },
    notes:{
        type: String,
        default: ""
    }
},{timestamps:true});

export const Clearance=mongoose.model('Clearance',clearanceSchema);

