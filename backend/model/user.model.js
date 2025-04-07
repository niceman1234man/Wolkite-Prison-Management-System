
import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    firstName:{
        type:String ,
        required:true
    },
    middleName:{
        type:String ,
        required:true
    },
    lastName:{
        type:String ,
        required:true
    },
    email:{
        type:String ,
        required:true
    },
    gender:{
        type:String ,
        required:true
    },
    role:{
        type:String ,
        required:true
    },
    passwordChanged:{
        type:Boolean,
        default:false,
    },
    isactivated:{
    type:Boolean,
    default:false,
    },
    prison:{
        type:String ,
        required:true,
        ref:"Prison",
    },
    photo:{
        type:String ,
        default:"",
    },
    password:{
        type:String ,
        
    }
},{timestamps:true});
export const User=mongoose.model('User',userSchema);

