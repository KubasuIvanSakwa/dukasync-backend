import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/user.model.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      const error = new Error("User does not exist");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (Object.keys(req.body).length === 0) {
      const error = new Error("Data to update cannot be empty");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 400;
      throw error;
    }

    
    let updates = {}
    const obj = ["first_name", "last_name", "phone", "country", "email"];


    for (const key in req.body) {
      if (obj.includes(key)) {
        if (req.body[key]) {
          updates[key] = req.body[key];
        }
      } else {
        const error = new Error("field not found");
        error.statusCode = 404;
        throw error;
      }
    }

    const emailconf = await User.findOne({
        email: updates.email,
        _id: { $ne: req.params.id }

     })

    if(emailconf) {
        const error = new Error('Email Already Exists')
        error.statusCode = 409
        throw error
    }

    if(updates.email) {
        if(!/\S+@\S+\.\S+/.test(updates.email)) {
            const error = new Error('Enter a valid email')
            error.statusCode = 400
            throw error
        }
    }

    const updatedUser = await User.updateOne(
      { _id: req.params.id },
      { $set: { ...updates } },
      { session }
    );

    await session.commitTransaction();

    const newUpdateUser = await User.findById(req.params.id).select(
      "-password"
    );

    session.endSession();
    res.status(200).json({
      success: true,
      message: "User Updated successfully",
      data: {
        user: newUpdateUser,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteUser = async (req, res, next) => { 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const updatedUser = await User.deleteOne({ _id: req.params.id }).session(session)

        const { deletedCount } = updatedUser

        if(deletedCount === 0) {
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "User was deleted successfully"
        })

    } catch(error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}