import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    slug: {
        type: String, 
        required: true,
        lowercase: true
    }
  },

);

subCategorySchema.index({ category: 1, slug: 1 }, { unique: true });

subCategorySchema.pre('validate', async function(next) {
    if(this.isModified('name') || this.isNew) { 
      let slug
      
      const generateSlug = (cat_name) => {
        slug = cat_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        }

        if(!this.name) {
          return next()
        } 
        
        generateSlug(this.name)
        this.slug = slug
        
        // Check for a duplicate slug ONLY within the current parent category (this.category)
        const existingSlug = await this.constructor.findOne({
          slug: this.slug,
          category: this.category, // <-- NEW CRITICAL FILTER
          _id: { $ne: this._id },
        });

        if(existingSlug) {
          const error = new Error("slug already exists")
          error.statusCode = 400
          return next(error)
        }
        
    }
    next()
})

const SubCategory = mongoose.model('subCategory', subCategorySchema)

export default SubCategory