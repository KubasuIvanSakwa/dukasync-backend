import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import SubCategory from "../models/subCategory.model.js";


export const createCategory = async (req, res, next) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // add a category
        const { name } = req.body

        const existingCategory = await Category.findOne({ name })

        if(existingCategory) {
            const error = new Error("Category already exists")
            error.statusCode = 400
            throw error
        }

        if(!name) {
            const error = new Error("Category cannot be empty")
            error.statusCode = 400
            throw error
        }


        // if new cat
        const category = await Category.create([{ name }], { session })

        await session.commitTransaction()
        session.endSession()
        res.status(201).json({
            success: true,
            message: "category created successfully",
            data: {
                Category: category[0],
            }
        })

    } catch(error) {
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

export const getCategory = async (req, res, next) => {
      try {
        const category = await Category.findById(req.params.id).populate('SubCategories')
    
        if (!category) {
          const error = new Error("category does not exist");
          error.statusCode = 404;
          throw error;
        }

        
    
        res.status(200).json({ success: true, data: category });
      } catch (error) {
        if (error.name === "CastError") { 
            const cleanError = new Error("category does not exist (Invalid ID format)");
            cleanError.statusCode = 404;
            return next(cleanError); // Use 'return next(error)' to exit cleanly
        }
        next(error);
      }
}

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().populate('SubCategories')

    res.status(200).json({ 
        success: true,  
        data: categories 
    });
  } catch (error) {
    next(error);
  }
}

export const updateCategory = async (req, res, next) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        if(Object.keys(req.body).length === 0) {
            const error = new Error("Data to update cannot be empty");
            error.statusCode = 400;
            throw error;
        }

        const { name } = req.body

        if(!name) {
            const error = new Error("Data to update cannot be empty");
            error.statusCode = 400;
            throw error;
        }

        const generateSlug = (cat_name) => {
            return cat_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        }

        
        const existingCategory = await Category.findOne({ 
            name: name,
            _id: { $ne: req.params.id } // <--- CRITICAL FIX: Prevents self-conflict
        });

        const currentCategory = await Category.findById(req.params.id)

        if(!currentCategory) {
            const error = new Error("Category does not exist");
            error.statusCode = 404;
            throw error;
        }

        if(currentCategory.name === name) {
            const error = new Error("Name is already up to date");
            error.statusCode = 400;
            throw error;
        }

        if(existingCategory) {
            const error = new Error("Category Already exists");
            error.statusCode = 400;
            throw error;
        }

        const newSlug = generateSlug(name)

        const updateProduct = await Category.updateOne(
            { _id: req.params.id },
            { $set: { name, slug: newSlug } },
            { session }
        )

        await session.commitTransaction()
        const newCategory = await Category.findById(req.params.id)

        session.endSession()
        res.status(200).json({
            success: true,
            message: "Category updated",
            data: {
                Category: newCategory
            }
        })
    }catch(error) {
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

export const deleteCategory = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const category = await Category.findById(req.params.id)
        const subCategory = await SubCategory.find({ category: req.params.id})
        const subCategoryIds = subCategory.map(sub => sub._id)

        if(!category){
            const error = new Error('Category does not exist')
            error.statusCode = 404
            throw error
        }
        
        const allDependentProducts = await Product.find({
            $or: [
                { category: req.params.id }, 
                { subCategory: { $in: subCategoryIds } } 
            ]
        });


        if (allDependentProducts.length > 0) {
            const error = new Error('Category & SubCategory in use')
            error.statusCode = 409
            throw error
        }

        if(subCategory.length > 0) {
            await SubCategory.deleteMany({ category: req.params.id }, { session });
        }

        const DeletedCat = await Category.deleteOne({ _id: req.params.id })

        const { deletedCount } = DeletedCat

        if(deletedCount === 0) {
            const error = new Error('Category not found')
            error.statusCode = 404
            throw error
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Category was deleted successfully"
        })

    } catch(error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}