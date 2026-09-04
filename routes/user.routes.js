import { Router } from "express";
import { getUser, getUsers, updateUser, deleteUser } from "../controllers/user.controller.js";
import { authorize } from "../middleware/auth.middleware.js";


const userRouter = Router()

userRouter.get('/', authorize, getUsers)

userRouter.get('/:id', authorize, getUser)

userRouter.put('/:id', authorize, updateUser)

userRouter.delete('/:id', authorize, deleteUser)

export default userRouter