import { Router } from "express";
import { authorize } from "../middleware/auth.middleware.js";
import { createCategory, deleteCategory, getAllCategories, getCategory, updateCategory } from "../controllers/category.controller.js";
import { createSubCategory, deleteSubCategory, getSubCategories, getSubCategory, updateSubCategory } from "../controllers/subCategory.controller.js";


const categoryRouter = Router()


categoryRouter.post('/create-category', authorize, createCategory)

categoryRouter.get('/', authorize, getAllCategories)

categoryRouter.get('/subcategories', authorize, getSubCategories)

categoryRouter.get('/:id', authorize, getCategory)

categoryRouter.put('/:id', authorize, updateCategory)

categoryRouter.delete('/:id', authorize, deleteCategory)

// SubCategory routes
categoryRouter.post('/subcategory', authorize, createSubCategory)

categoryRouter.get('/subcategory/:id', authorize, getSubCategory)

categoryRouter.put('/subcategory/:id', authorize, updateSubCategory)

categoryRouter.delete('/subcategory/:id', authorize, deleteSubCategory)


export default categoryRouter