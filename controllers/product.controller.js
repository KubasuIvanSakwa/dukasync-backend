import mongoose, { mongo } from "mongoose";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import SubCategory from "../models/subCategory.model.js";
import Supplier from "../models/supplier.model.js";

export const createProduct = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      description,
      price,
      stockQuantity,
      sku,
      category,
      subCategory,
      reorderThreshold,
      supplier,
    } = req.body;

    // 1. Check for required fields first to prevent CastErrors on lookups
    if (
      !name ||
      !description ||
      !price ||
      !stockQuantity ||
      !sku ||
      !category ||
      !supplier // Added supplier as a required field based on your DukaSync logic
    ) {
      const error = new Error("Some required fields are missing");
      error.statusCode = 400;
      throw error;
    }

    // 2. Perform database lookups
    const existingSku = await Product.findOne({ sku });
    const existingCategory = await Category.findById(category);
    const existingSupplier = await Supplier.findById(supplier);

    if (existingSku) {
      const error = new Error("SKU already exists");
      error.statusCode = 400;
      throw error;
    }

    if (!existingCategory) {
      const error = new Error("Category does not exist");
      error.statusCode = 404;
      throw error;
    }

    if (!existingSupplier) {
      const error = new Error("Supplier does not exist");
      error.statusCode = 404;
      throw error;
    }

    if (subCategory) {
      const existingSubCategory = await SubCategory.findById(subCategory);
      if (!existingSubCategory) {
        const error = new Error("subCategory does not exist");
        error.statusCode = 404;
        throw error;
      }
    }

    // Step 1: Create a base object with required fields
    const productData = {
      name,
      description,
      price,
      stockQuantity,
      sku,
      category,
      reorderThreshold,
      supplier,
    };

    // Step 2: Conditionally add optional fields if they are present in req.body
    if (req.body.images) {
      productData.images = req.body.images;
    }
    if (req.body.subCategory) {
      productData.subCategory = req.body.subCategory;
    }

    const product = await Product.create([productData], { session });

    await Supplier.findByIdAndUpdate(
      supplier,
      { $push: { products: product[0]._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      success: true,
      message: "product created successfully",
      data: {
        Product: product[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const AllProducts = async (req, res, next) => {
    try {
    const products = await Product.find().select("-password");

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export const updateProduct = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (Object.keys(req.body).length === 0) {
            const error = new Error("Data to update cannot be empty");
            error.statusCode = 400;
            throw error;
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        // 1. Build the update objects
        let setUpdates = {};
        const allowedFields = ['name', 'description', 'price', 'stockQuantity', 'sku', 'category', 'subCategory'];

        for (const key in req.body) {
            if (allowedFields.includes(key) && req.body[key] !== undefined) {
                setUpdates[key] = req.body[key];
            }
        }

        // 2. Validation Logic for Categories and SKU
        if (setUpdates.category) {
            const existingCategory = await Category.findById(setUpdates.category);
            if (!existingCategory) {
                const error = new Error("Category not found");
                error.statusCode = 404;
                throw error;
            }
        }

        if (setUpdates.sku) {
            const existingSku = await Product.findOne({ 
                sku: setUpdates.sku,
                _id: { $ne: req.params.id } 
            });
            if (existingSku) {
                const error = new Error("SKU already exists");
                error.statusCode = 400;
                throw error;
            }
        }

        if (setUpdates.subCategory) {
            const existingSubCategory = await SubCategory.findById(setUpdates.subCategory);
            if (!existingSubCategory) {
                const error = new Error("SubCategory not found");
                error.statusCode = 404;
                throw error;
            }
        }

        // 3. Construct the Atomic Query
        const updateQuery = { $set: setUpdates };

        if (req.body.images && Array.isArray(req.body.images)) {
            if (req.body.appendImages === true) {
                // Use $push with $each to add new images to the end of the array
                updateQuery.$push = { images: { $each: req.body.images } };
            } else {
                // Standard $set to replace the whole array
                updateQuery.$set.images = req.body.images;
            }
        }

        // 4. Apply Updates in a single atomic operation
        await Product.updateOne(
            { _id: req.params.id },
            updateQuery,
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        // Fetch fresh data for response
        const newUpdatedProduct = await Product.findById(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: {
                product: newUpdatedProduct
            }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const  product = await Product.findById(req.params.id)
      
      if(!product) {
        const error = new Error('Product not found')
        error.statusCode = 404
        throw error
      }
      
      const deletedProduct = await Product.deleteOne({ _id: req.params.id })

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
          success: true,
          message: "Product was deleted successfully"
      })

    } catch(error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}
