import mongoose, { mongo } from "mongoose";
import Cart from "../models/cart.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";

export const createCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user, items } = req.body;
    const exstingUser = await User.findById(user).session(session);
    const existingCart = await Cart.findOne({ user: user }).session(session);

    if (!exstingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (!items) {
      const error = new Error("cart cannot be empty");
      error.statusCode = 400;
      throw error;
    }

    const incomingItems = req.body.items;

    let calculatedSubtotal = 0;
    let cleanCart = [];
    let userCart;

    for (const item of incomingItems) {
      const productDocument = await Product.findById(item.productId);

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

      cleanCart.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: itemPrice,
      });

      calculatedSubtotal += lineTotal;
    }

    if (existingCart?._id) {
      let updatecart = await Cart.updateOne(
        { _id: existingCart._id },
        { $set: { items: cleanCart, subtotal: calculatedSubtotal } },
        { session }
      );
      userCart = await Cart.findById(existingCart?._id).session(session);
    } else {
      userCart = await Cart.create(
        [{ user, items: cleanCart, subtotal: calculatedSubtotal }],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      success: true,
      data: userCart,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const AllCart = await Cart.findOne({ user: req.params.id });

    console.log(AllCart);

    if (!AllCart) {
      const error = new Error("Cart for User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: AllCart,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItemFromCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user, productId } = req.body
    const todeleteCartFrom = await Cart.findOne({ user: user }).session(session) 

    if(!todeleteCartFrom) {
        const error = new Error("User Cart not found");
        error.statusCode = 404;
        throw error;
    }

    const deleteItem = await Cart.updateOne(
        {user: user},
        { $pull: { items: { productId: productId }} },
        { session }
    )

    const updatedCart = await Cart.findOne({ user: user}).session(session)

    let calculatedSubtotal = 0;
    let userCart;

    for (const item of updatedCart.items) {
      const lineTotal = item.quantity * item.priceAtOrder;

      calculatedSubtotal += lineTotal;
    }

    const updateTotal = await Cart.updateOne(
      {user: user},
      { $set: {subtotal: calculatedSubtotal}},
      { session }
    )

    const newCart = await Cart.findOne({ user: user }).session(session); 

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Cart Item was deleted successfully",
      data: newCart
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const todeleteCart = await Cart.deleteOne({ _id: req.params.id }, {session});

    const { deletedCount } = todeleteCart;

    if (deletedCount === 0) {
      const error = new Error("User Cart not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "User Cart was deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
