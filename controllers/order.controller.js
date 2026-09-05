import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

import { Queue } from "bullmq";
import Redis from "ioredis";

const redisConnection = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: null,
    family: 4, 
    tls: { rejectUnauthorized: false } 
});

redisConnection.on('connect', () => console.log('🟢 [Order Controller] Redis connected successfully!'));
redisConnection.on('error', (err) => { if (err.code !== 'ECONNRESET') console.error('🔴 Redis Error:', err.message); });

const restockQueue = new Queue('restock-alerts', { connection: redisConnection });

export const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const {user, items} = req.body
        const existingUser = await User.findById(user).session(session)
        const existingCart = await Cart.findOne({ user: user }).session(session)

        if (!existingUser) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        if (!items) {
            const error = new Error("cart cannot be empty");
            error.statusCode = 400;
            throw error;
        }

        if (!existingCart) {
            const error = new Error("cart does not exist");
            error.statusCode = 400;
            throw error;
        }

    const incomingItems = req.body.items;
    let calculatedTotal = 0;
    let cleanOrder = [];
    
    for (const item of incomingItems) {
        const productDocument = await Product.findById(item.productId).session(session);
        
        if (!productDocument) {
            const error = new Error(`Product with ID ${item.productId} not found.`);
            error.statusCode = 404;
            throw error;
        }

        if (item.quantity <= 0) {
            const error = new Error(`Product quantity cannot be zero.`);
            error.statusCode = 400;
            throw error;
        }

      const itemPrice = productDocument.price;
      const lineTotal = item.quantity * itemPrice;

      if(productDocument.stockQuantity >= item.quantity) {
          await Product.updateOne(
            {_id: item.productId},
            {$inc: { stockQuantity: -item.quantity }},
            { session }
          )

          // --- DUKASYNC AUTOMATED RESTOCK TRIGGER ---
          const remainingStock = productDocument.stockQuantity - item.quantity;
          
          // X-RAY LOG 1: Show the math
          console.log(`\n🛑 DEBUG: Remaining Stock = ${remainingStock} | Threshold = ${productDocument.reorderThreshold}`);
          
          if (remainingStock <= productDocument.reorderThreshold) {
              // X-RAY LOG 2: Confirm it went into the queue
              console.log(`🟢 DEBUG: Threshold met! Pushing job to BullMQ...`);
              await restockQueue.add('send-supplier-alert', {
                  product: item.productId,
                  supplier: productDocument.supplier,
                  quantityRequested: 50
              }, { delay: 2000 });
          } else {
              // X-RAY LOG 3: Explain why it skipped
              console.log(`🟡 DEBUG: Threshold NOT met. Queue bypassed.`);
          }
          // -----------------------------------------

      } else {
        const error = new Error(`${item.quantity} is greater than ${productDocument.stockQuantity}`);
        error.statusCode = 400;
        throw error;
      }

      cleanOrder.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: itemPrice,
      });

      calculatedTotal += lineTotal;
    }

    const newOrder = await Order.create([{user, items: cleanOrder, Total: calculatedTotal }], { session })
    await Cart.deleteOne({ user: user }, { session });
    
    await session.commitTransaction()
    session.endSession()
    res.status(200).json({
        success: true,
        message: "order received",
        data: {
            Order: newOrder
        }
    })
    
    } catch(error){
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

export const getOrdersById = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.id })
            .populate('items.productId') 
            .sort({ createdAt: -1 })
            
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}