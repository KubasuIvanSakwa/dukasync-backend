import mongoose from "mongoose";
import SubCategory from "../models/subCategory.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";


export const createSubCategory = async (req, res, next) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // add a category
        const { name, category } = req.body

        //check if user already exists
        const existingSubCategory = await SubCategory.findOne({ name, category })
        const existingCategory = await Category.findById(category)

        if(existingSubCategory) {
            const error = new Error("subCategory already exists")
            error.statusCode = 400
            throw error
        }

        if(!existingCategory) {
            const error = new Error("Category does not exists")
            error.statusCode = 404
            throw error
        }

        if(!name) {
            const error = new Error("subCategory cannot be empty")
            error.statusCode = 400
            throw error
        }


        // if new subcat
        const subCategory = await SubCategory.create([{ name, category }], { session })

        await session.commitTransaction()
        session.endSession()
        res.status(201).json({
            success: true,
            message: "subCategory created successfully",
            data: {
                SubCategory: subCategory[0],
            }
        })

    } catch(error) {
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

export const updateSubCategory = async (req, res, next) => {
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
        
        const existingSubCategory = await SubCategory.findOne({ 
            name: name,
            _id: { $ne: req.params.id } 
        });

        const currentSubCategory = await SubCategory.findById(req.params.id)

        if(!currentSubCategory) {
            const error = new Error("SubCategory does not exist");
            error.statusCode = 404;
            throw error;
        }

        if(currentSubCategory.name === name) {
            const error = new Error("Name is already up to date");
            error.statusCode = 400;
            throw error;
        }


        if(existingSubCategory) {
            const error = new Error("SubCategory Already exists");
            error.statusCode = 400;
            throw error;
        }

        const newSlug = generateSlug(name)

        const updateSubCategory = await SubCategory.updateOne(
            { _id: req.params.id },
            { $set: { name, slug: newSlug } },
            { session }
        )

        await session.commitTransaction()
        const newSubCategory = await SubCategory.findById(req.params.id)

        session.endSession()
        res.status(200).json({
            success: true,
            message: "SubCategory updated",
            data: {
                SubCategory: newSubCategory
            }
        })
    }catch(error) {
        await session.abortTransaction()
        session.endSession()
        next(error)
    }
}

export const getSubCategories = async (req, res, next) => { 
    try {
        const subCategories = await SubCategory.find().populate('category')
        res.status(200).json({ 
            success: true,  
            data: subCategories 
        });
  } catch (error) {
    next(error);
  }
}

export const getSubCategory = async (req, res, next) => {
      try {
        const subCategory = await SubCategory.findById(req.params.id).populate('category')
        if (!subCategory) {
          const error = new Error("subCategory does not exist");
          error.statusCode = 404;
          throw error;
        }


        res.status(200).json({ success: true, data: subCategory });
      } catch (error) {
        if (error.name === "CastError") { 
            const cleanError = new Error("subCategory does not exist (Invalid ID format)");
            cleanError.statusCode = 404;
            return next(cleanError); // Use 'return next(error)' to exit cleanly
        }
        next(error);
      }
}

export const deleteSubCategory = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        
        const products = await Product.find({ subCategory: req.params.id})
        const subCategory = await SubCategory.findById(req.params.id)

        if(!subCategory){
            const error = new Error('subCategory does not exist')
            error.statusCode = 404
            throw error
        }

        if(products.length > 0) {
            const error = new Error('subCategory in use')
            error.statusCode = 409
            throw error
        }



        const DeletedCat = await SubCategory.deleteOne({ _id: req.params.id })

        const { deletedCount } = DeletedCat

        if(deletedCount === 0) {
            const error = new Error('subCategory not found')
            error.statusCode = 404
            throw error
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "subCategory was deleted successfully"
        })

    } catch(error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}



