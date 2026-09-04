import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, "supplier name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    phoneNumber: {
        type: String,
        required: [true, "phone number required"],
    },
    channel: {
        type: String,
        enum: ['whatsapp', 'sms'], // Restricts input to specific channels
        default: 'whatsapp' // Removed the array brackets
    },
    webhookSecret: {
        type: String,
        required: [true, "webhook secret is required for secure confirmations"]
    },
    products: [{ // Wrapped in array: A supplier provides MANY products
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    }],
    restockOrders: [{ // Wrapped in array: A supplier has MANY restock orders
        type: mongoose.Schema.Types.ObjectId,
        ref: 'restock'
    }]
}, {timestamps: true});

const Supplier = mongoose.model('supplier', supplierSchema);

export default Supplier;