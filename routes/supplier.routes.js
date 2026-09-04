import { Router } from "express";
import mongoose from "mongoose";
import { authorize } from "../middleware/auth.middleware.js";
import { createSupplier, deleteSupplier, getSupplierById, getSuppliers, updateSupplier } from "../controllers/supplier.controller.js";


const supplierRouter = Router()

supplierRouter.post('/create-supplier', authorize, createSupplier)

supplierRouter.get('/', authorize, getSuppliers)

supplierRouter.get('/:id', authorize, getSupplierById)

supplierRouter.put('/:id', authorize, updateSupplier)

supplierRouter.delete('/:id', authorize, deleteSupplier)



export default supplierRouter