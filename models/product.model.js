import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "product name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
      minlength: [
        50,
        "Product description must be at least 50 characters long to provide enough detail for customers and search engines.",
      ],
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: [true, 'The product price is required for the listing.'],
      min: [0, 'Price cannot be negative. Please enter zero for free items.'],
      // Max limit to prevent accidental high entries
      max: [9999999, 'Price exceeds the maximum allowed value.'], 
      //  allowed integers or two decimal places
      validate: {
         validator: function(v) {
               // Allows 1000 or 1000.50 but not 1000.505
               return /^\d+(\.\d{1,2})?$/.test(v); 
         },
         message: props => `${props.value} is not a valid price format. Use up to two decimal places (e.g., 1500.00).`
      }
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    sku: {
        type: String,
        required: true,
        unique: [true, 'SKU must be unique'],
        maxlength: 20
    },
    images: {
        type: [String], // Array of image URLs
        default: ["https://placehold.co/600x400"]
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, // Recommended for relation
        ref: 'category', // Reference to the separate Category model
        required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'subCategory',
      required: false
    },
    reorderThreshold: {
      type: Number,
      min: [0, 'threshold cannot be negative']
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'suppplier'
    },
    restockOrders: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'restock'
    }

  },
  { timestamps: true }
);

const Product = mongoose.model('product', productSchema)

export default Product