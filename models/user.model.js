import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   first_name: {
      type: String,
      required: [true, 'user first name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
   },
   last_name: {
      type: String,
      required: [true, 'user last name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
   },
   email : {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'please fill a valid email address']
   },
   role: {
      type: String,
      default: "customer",
      enum: ["customer", "admin"]
   },
   country: {
      type: String,
      required: [true, 'select a region'],
      trim: true,
   },
   phone: {
      type: Number,
      required: [true, 'phone number is required'],
      match: [/^\\d{10}$/, 'please use a valid phone number']

   },
   password: {
      type: String,
      required: [true, 'user password is required'],
      minlength: 4,  
   },

}, { timestamps: true})

const User = mongoose.model('user', userSchema)

export default User