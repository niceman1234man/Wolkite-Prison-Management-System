import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const createAccount = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    gender,
    role,
    photo,
    password,
  } = req.body;
  if (!firstName || !email || !password) {
    return res.status(400).json("all fields required");
  }
  const isUser = await User.findOne({ email: email });
  if (isUser) return res.status(400).json("User Already existed");
  const newUser = new User({
    firstName,
    middleName,
    lastName,
    email,
    gender,
    role,
    photo,
    password,
  });
  await newUser.save();
  const accessToken = jwt.sign({ newUser }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "36000m",
  });
  return res
    .status(201)
    .json({
      error: false,
      accessToken,
      message: "user registered successfully",
    });
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json("please all fields");
    }
    const userInfo = await User.findOne({ email: email });
    if (!userInfo) {
      return res.status(400).json("user not exist");
    }
    if (userInfo.password !== password) {
      return res.status(400).json("password not match");
    }
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });
    res
      .status(200)
      .json({ userInfo, accessToken, mesage: "Login Successfully" });
  } catch (error) {
    console.log(error);
  }
};

export const getUser = async (req, res) => {
  try {
    const {id}=req.params;
    const userInfo = await User.findOne({ _id: id });
    if (!userInfo) {
      return res.status(400).json({ message: "User does not exist" });
    }

    res.status(200).json({ user: userInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
    try {
      const userInfo = await User.find();
  
      if (!userInfo) {
        return res.status(400).json({ message: "User does not exist" });
      }
  
      res.status(200).json({ user: userInfo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  export const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const {  firstName,
        middleName,
        lastName,
        email,
        gender,
        role,
        photo,} = req.body;
  
      if (!firstName || !middleName || !email || !role || !gender) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const updateduser = await User.findByIdAndUpdate(
        id,
        {  firstName,
          middleName,
          lastName,
          email,
          gender,
          role,
          photo,},
        { new: true} 
      );
  
      if (!updateduser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ data: updateduser, message: "User information updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };