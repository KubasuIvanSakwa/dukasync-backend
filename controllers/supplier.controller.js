import Supplier from "../models/supplier.model.js";
import crypto from "crypto";

export const createSupplier = async (req, res, next) => {
  try {
    const { name, phoneNumber, channel } = req.body;

    if (!name || !phoneNumber) {
      const error = new Error("Name and phone number are required");
      error.statusCode = 400;
      throw error;
    }

    // Auto-generate a secure 64-character secret for webhook verification
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    const newSupplier = await Supplier.create({
      name,
      phoneNumber,
      channel: channel || "whatsapp",
      webhookSecret,
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: newSupplier,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    // Optionally populate products to see what this supplier provides
    const suppliers = await Supplier.find().populate("products", "name sku stockQuantity");

    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate("products", "name sku stockQuantity price")
      .populate("restockOrders");

    if (!supplier) {
      const error = new Error("Supplier not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const { name, phoneNumber, channel } = req.body;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, phoneNumber, channel },
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      const error = new Error("Supplier not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: updatedSupplier,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      const error = new Error("Supplier not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};