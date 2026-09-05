import { Router } from "express";
import { authorize } from "../middleware/auth.middleware.js";
import { createOrder, getOrdersById } from "../controllers/order.controller.js";


const orderRouter = Router()

orderRouter.post('/', authorize, createOrder)
orderRouter.get('/:id', authorize, getOrdersById)
orderRouter.get('/admin/all', authorize, getAllOrdersAdmin);

export default orderRouter