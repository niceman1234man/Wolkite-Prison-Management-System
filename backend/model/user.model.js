import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const userSchema = new Schema({
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
        default:null,
    },
    photo:{
        type:String ,
        default:"default-avatar.png",
    },
    password:{
        type:String ,
        
    },
    lastLogin:{
        type:Date,
        default:null
    },
    loginCount:{
        type:Number,
        default:0
    },
    passwordSent: {
        type: Boolean,
        default: false
    }
},{timestamps:true});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export const User=mongoose.model('User',userSchema);

