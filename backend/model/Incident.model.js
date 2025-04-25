import mongoose from "mongoose";
const incidentSchema=new mongoose.Schema({
    incidentId:{
        type:String ,
        required:true
    },
    reporter:{
        type:String ,
        required:true
    },
    inmate:{
        type:String ,
        required:true
    },
    inmateId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inmate'
    },
    incidentDate:{
        type:Date ,
        required:true
    },
    incidentType:{
        type:String ,
        required:true
    },
    status:{
        type:String ,
        required:true
    },
    severity:{
        type:String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    attachment:{
        type:String ,
       
    },
    description:{
        type:String ,
        required:true,
    },
    isRepeat:{
        type: Boolean,
        default: false
    },
    repeatCount:{
        type: Number,
        default: 1
    }
    
},{timestamps:true});
export const Incident=mongoose.model('Incident',incidentSchema);

