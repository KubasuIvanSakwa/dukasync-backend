import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import Restock from "../models/restock.model.js";
import Product from "../models/product.model.js";
import Supplier from "../models/supplier.model.js";
import crypto from "crypto";
import twilio from "twilio";

// Initialize Twilio using your environment variables
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const redisConnection = new Redis(process.env.REDIS_URI, { 
    maxRetriesPerRequest: null,
    family: 4,
    tls: { rejectUnauthorized: false }
});

redisConnection.on('connect', () => console.log('🟢 [Background Worker] Redis connected successfully!'));

const worker = new Worker('restock-alerts', async (job) => {
    console.log(`[Queue] Processing restock alert for product ${job.data.product}`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { product, supplier, quantityRequested } = job.data;
        const idempotencyKey = crypto.randomUUID();

        // 1. Create the Pending Restock Order
        const newRestock = await Restock.create(
            [{ product, supplier, quantityRequested, idempotencyKey }],
            { session }
        );

        // 2. Link to Product and Supplier
        await Product.findByIdAndUpdate(product, { $push: { restockOrders: newRestock[0]._id } }, { session });
        await Supplier.findByIdAndUpdate(supplier, { $push: { restockOrders: newRestock[0]._id } }, { session });

        // 3. Fetch data and fire the real Twilio WhatsApp API FIRST
        const supplierData = await Supplier.findById(supplier).session(session);
        const productData = await Product.findById(product).session(session); // Fetches the product name
        
        const message = await twilioClient.messages.create({
            body: `🚨 *DukaSync Alert* 🚨\n\nStock is running low.\nPlease restock *${quantityRequested} units* of ${productData.name}.\n\nReply YES to confirm this order.`,
            from: `whatsapp:+14155238886`, 
            to: `whatsapp:${supplierData.phoneNumber}` 
        });

        console.log(`[Queue] 🟢 REAL WHATSAPP SENT! Message SID: ${message.sid}`);

        // 4. ONLY COMMIT IF TWILIO SUCCEEDS
        await session.commitTransaction();
        console.log(`[Queue] Restock order ${newRestock[0]._id} saved to database.`);

    } catch (error) {
        await session.abortTransaction();
        console.error(`[Queue] Job failed because of Twilio:`, error.message); 
        throw error;
    } finally {
        session.endSession();
    }
}, { connection: redisConnection });

worker.on('completed', (job) => console.log(`Job ${job.id} has completed!`));
worker.on('failed', (job, err) => console.log(`Job ${job.id} has failed with ${err.message}`));