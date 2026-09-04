import { Router } from "express";
import mongoose from "mongoose";
import { authorize } from "../middleware/auth.middleware.js";
import { createRestockOrder, deleteRestockOrder, getRestockOrderById, getRestockOrders, updateRestockStatus } from "../controllers/restock.controller.js";



const restockRouter = Router()

restockRouter.post('/create-restock', authorize, createRestockOrder)

restockRouter.get('/', authorize, getRestockOrders)

restockRouter.get('/:id', authorize, getRestockOrderById)

restockRouter.put('/:id', authorize, updateRestockStatus)

restockRouter.delete('/:id', authorize, deleteRestockOrder)



export default restockRouter