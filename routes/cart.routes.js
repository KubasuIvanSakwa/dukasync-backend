import { Router } from "express";
import { createCart, deleteCart, getCart, deleteItemFromCart } from "../controllers/cart.controller.js";
import { authorize } from "../middleware/auth.middleware.js";

const cartRouter = Router()


cartRouter.post('/:id', authorize, createCart)
cartRouter.get('/all/:id', authorize, getCart)

cartRouter.delete('/:id', authorize, deleteCart)
cartRouter.delete('/item/:id', authorize, deleteItemFromCart)

export default cartRouter