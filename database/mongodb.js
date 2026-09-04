import mongoose from "mongoose";

import { DB_URI, NODE_ENV } from "../config/env.js";

if(!DB_URI) {
    throw new Error('Please define the MONGODB_URI environment variale inside .env.<devlopment/>production>.local')
}

const connectToDatabse = async () => {
    try {
        mongoose.connect(DB_URI)

        console.log(`connected to database in ${NODE_ENV} mode`)
    } catch(error) {
        console.group(`Error connecting to Databse: ${error}`)
        process.exit(1)
    }
}

export default connectToDatabse