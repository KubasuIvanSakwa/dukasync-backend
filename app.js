import express from "express";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";

import errorMiddleware from "./middleware/error.middleware.js";
import categoryRouter from "./routes/category.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import orderRouter from "./routes/order.routes.js";
import restockRouter from "./routes/restock.routes.js";
import supplierRouter from "./routes/supplier.routes.js";
import "./workers/restockWorker.js";

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/api/v1/users', userRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/cat', categoryRouter)
app.use('/api/v1/product', productRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/order', orderRouter)
app.use('/api/v1/restock', restockRouter)
app.use('/api/v1/supplier', supplierRouter)

app.use(errorMiddleware)


export default app