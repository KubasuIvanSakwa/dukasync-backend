import mongoose from "mongoose";
import Restock from "../models/restock.model.js";
import Product from "../models/product.model.js";
import Supplier from "../models/supplier.model.js";

export const createRestockOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { product, supplier, quantityRequested, idempotencyKey } = req.body;

    if (!product || !supplier || !quantityRequested) {
      const error = new Error("Product, supplier, and quantityRequested are required");
      error.statusCode = 400;
      throw error;
    }

    const existingProduct = await Product.findById(product).session(session);
    const existingSupplier = await Supplier.findById(supplier).session(session);

    if (!existingProduct || !existingSupplier) {
      const error = new Error("Product or Supplier not found");
      error.statusCode = 404;
      throw error;
    }

    const existingActiveRestock = await Restock.findOne({
      product: product,
      status: { $in: ["PENDING", "CONFIRMED"] }
    }).session(session);

    if (existingActiveRestock) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "Restock already in progress. Duplicate request ignored.",
        data: existingActiveRestock,
      });
    }

    const newRestock = await Restock.create(
      [{ product, supplier, quantityRequested, idempotencyKey }],
      { session }
    );

    const restockId = newRestock[0]._id;

    await Product.findByIdAndUpdate(
      product,
      { $push: { restockOrders: restockId } },
      { session }
    );

    await Supplier.findByIdAndUpdate(
      supplier,
      { $push: { restockOrders: restockId } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Restock order created successfully",
      data: newRestock[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error.code === 11000) {
      error.message = "A restock order with this idempotency key already exists.";
      error.statusCode = 409;
    }
    next(error);
  }
};

export const getRestockOrders = async (req, res, next) => {
  try {
    // Allows filtering by status via query params (e.g., /api/restocks?status=PENDING)
    const filter = req.query.status ? { status: req.query.status } : {};

    const restocks = await Restock.find(filter)
      .populate("product", "name sku stockQuantity")
      .populate("supplier", "name phoneNumber channel")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      data: restocks,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestockOrderById = async (req, res, next) => {
  try {
    const restock = await Restock.findById(req.params.id)
      .populate("product", "name sku stockQuantity reorderThreshold")
      .populate("supplier", "name phoneNumber channel");

    if (!restock) {
      const error = new Error("Restock order not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: restock,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRestockStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;
    const allowedStatuses = ["PENDING", "CONFIRMED", "DELIVERED", "FAILED"];

    if (!allowedStatuses.includes(status)) {
      const error = new Error("Invalid status update");
      error.statusCode = 400;
      throw error;
    }

    const restock = await Restock.findById(req.params.id).session(session);

    if (!restock) {
      const error = new Error("Restock order not found");
      error.statusCode = 404;
      throw error;
    }

    // Prevent processing a delivery twice
    if (restock.status === "DELIVERED") {
      const error = new Error("This restock order has already been delivered");
      error.statusCode = 400;
      throw error;
    }

    restock.status = status;

    if (status === "CONFIRMED") {
      restock.confirmedAt = new Date();
    }

    // If delivery is complete, physically increment the product's inventory count
    if (status === "DELIVERED") {
      await Product.findByIdAndUpdate(
        restock.product,
        { $inc: { stockQuantity: restock.quantityRequested } },
        { session }
      );
    }

    await restock.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Restock order marked as ${status}`,
      data: restock,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteRestockOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const restock = await Restock.findById(req.params.id).session(session);

    if (!restock) {
      const error = new Error("Restock order not found");
      error.statusCode = 404;
      throw error;
    }

    // Remove the restock reference from both the Product and Supplier arrays
    await Product.findByIdAndUpdate(
      restock.product,
      { $pull: { restockOrders: restock._id } },
      { session }
    );

    await Supplier.findByIdAndUpdate(
      restock.supplier,
      { $pull: { restockOrders: restock._id } },
      { session }
    );

    await Restock.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Restock order deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};