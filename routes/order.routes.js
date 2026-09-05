import { Router } from "express";
import mongoose from "mongoose";
import { authorize } from "../middleware/auth.middleware.js";
import { createOrder, getOrdersById } from "../controllers/order.controller.js";


const orderRouter = Router()

orderRouter.post('/', authorize, createOrder)
orderRouter.post('/:id', authorize, getOrdersById)

export default orderRouter