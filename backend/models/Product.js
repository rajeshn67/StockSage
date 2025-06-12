const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      minlength: [2, "Category must be at least 2 characters long"],
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: (v) => v >= 0 && Number.isFinite(v),
        message: "Price must be a valid positive number",
      },
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
      validate: {
        validator: (v) => v >= 0 && Number.isFinite(v),
        message: "Cost price must be a valid positive number",
      },
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 0,
        message: "Quantity must be a non-negative integer",
      },
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: [0, "Minimum stock level cannot be negative"],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 0,
        message: "Minimum stock level must be a non-negative integer",
      },
    },
    image: {
      type: String,
      default: "",
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v),
        message: "Image must be a valid URL",
      },
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: [50, "Barcode cannot exceed 50 characters"],
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, "Supplier name cannot exceed 100 characters"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
productSchema.index({ name: "text", description: "text", category: "text" })
productSchema.index({ userId: 1, category: 1 })
productSchema.index({ userId: 1, quantity: 1 })
productSchema.index({ barcode: 1 }, { sparse: true })

// Virtual for profit margin
productSchema.virtual("profitMargin").get(function () {
  if (this.costPrice > 0) {
    return (((this.price - this.costPrice) / this.costPrice) * 100).toFixed(2)
  }
  return 0
})

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out-of-stock"
  if (this.quantity <= this.minStockLevel) return "low-stock"
  return "in-stock"
})

// Ensure virtuals are included in JSON
productSchema.set("toJSON", { virtuals: true })

module.exports = mongoose.model("Product", productSchema)
