import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
 /* 
    user -> ref from user.model.js
    items
    shippingAddress
    paymentMethod
    paymentStatus
    orderStatus
    totalAmount
    mpesaRef
 */
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
   },
   items: [
      {
         productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
         },
         quantity: {
            type: Number,
            required: true,
            min: 1, 
         },
         priceAtOrder: {
            // price snapshot
            type: Number,
            required: true,
         },
      }
   ],
   
   Total: {
      type: Number,
      required: true,
      default: 0,
    },
}, { timestamps: true})

const Order = mongoose.model('order', orderSchema)

export default Order