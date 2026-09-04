import mongoose from "mongoose";

const restockSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'FAILED'],
        default: 'PENDING'
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    supplier: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'supplier', // Fixed typo from 'suppplier' to match your supplier model name
          required: true
    },
    quantityRequested: {
        type: Number,
        required: true
    },
    confirmedAt: {
        type: Date,
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomUUID()
    },
}, {timestamps: true});

const Restock = mongoose.model('restock', restockSchema);

export default Restock;