import { Router } from "express";
import mongoose from "mongoose";
import { authorize } from "../middleware/auth.middleware.js";
import { AllProducts, createProduct, deleteProduct, updateProduct } from "../controllers/product.controller.js";

const productRouter = Router()

productRouter.post('/create-product', authorize, createProduct)

productRouter.get('/', AllProducts)

productRouter.put('/:id', authorize, updateProduct)

productRouter.delete('/:id', authorize, deleteProduct)



export default productRouter