import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: [true, 'Category cannot be empty'],
        unique: true, 
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    slug: {
        type: String, 
        unique: true, 
        lowercase: true
    },
    
  },
  { 
    timestamps: true, // Assuming you have this
    // --- ADD THESE LINES ---
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }

);


categorySchema.virtual('SubCategories', {
      ref: "subCategory",
      localField: '_id',
      foreignField: 'category'
})

categorySchema.pre('validate', async function(next) {
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
        
        // Check for any category with the same slug BUT a different ID
        const existingSlug = await this.constructor.findOne({ 
          slug: this.slug, 
          _id: { $ne: this._id } 
        })

        if(existingSlug) {
          const error = new Error("slug already exists")
          error.statusCode = 400
          return next(error)
        }
        
    }
    next()
})


const Category = mongoose.model('category', categorySchema)

export default Category