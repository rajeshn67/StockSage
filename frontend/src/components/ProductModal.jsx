"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { X, Loader2 } from "lucide-react"
import { useDispatch } from "react-redux"
import { createProduct, updateProduct } from "../store/slices/productSlice"
import toast from "react-hot-toast"

const ProductModal = ({ isOpen, onClose, product = null, categories = [] }) => {
  const [imagePreview, setImagePreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm()

  const watchedImage = watch("image")

  // Only run this effect when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Populate form with existing product data
        Object.keys(product).forEach((key) => {
          if (key !== "image" && key !== "_id") {
            setValue(key, product[key])
          }
        })
        setImagePreview(product.image || "")
      } else {
        reset({
          name: "",
          description: "",
          category: "",
          price: "",
          costPrice: "",
          quantity: "",
          minStockLevel: "10",
          barcode: "",
          supplier: "",
        })
        setImagePreview("")
      }
    }
  }, [product, isOpen, setValue, reset])

  // Handle image preview
  useEffect(() => {
    if (watchedImage && watchedImage[0]) {
      const file = watchedImage[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }, [watchedImage])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const formData = {
        name: data.name,
        description: data.description || "",
        category: data.category,
        price: Number.parseFloat(data.price),
        costPrice: Number.parseFloat(data.costPrice),
        quantity: Number.parseInt(data.quantity),
        minStockLevel: Number.parseInt(data.minStockLevel) || 10,
        barcode: data.barcode || "",
        supplier: data.supplier || "",
      }

      if (data.image && data.image[0]) {
        formData.image = data.image[0]
      }

      let result
      if (product) {
        result = await dispatch(updateProduct({ id: product._id, productData: formData }))
      } else {
        result = await dispatch(createProduct(formData))
      }

      if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
        toast.success(`Product ${product ? "updated" : "created"} successfully!`)
        onClose()
        reset()
        setImagePreview("")
      } else {
        toast.error(result.payload || `Failed to ${product ? "update" : "create"} product`)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{product ? "Edit Product" : "Add New Product"}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                {...register("name", {
                  required: "Product name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                type="text"
                className="input"
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                {...register("category", {
                  required: "Category is required",
                })}
                type="text"
                list="categories"
                className="input"
                placeholder="Enter or select category"
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price must be positive" },
                })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹) *</label>
              <input
                {...register("costPrice", {
                  required: "Cost price is required",
                  min: { value: 0, message: "Cost price must be positive" },
                })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
              {errors.costPrice && <p className="text-red-600 text-sm mt-1">{errors.costPrice.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 0, message: "Quantity must be non-negative" },
                })}
                type="number"
                className="input"
                placeholder="0"
              />
              {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <input
                {...register("minStockLevel", {
                  min: { value: 0, message: "Min stock level must be non-negative" },
                })}
                type="number"
                className="input"
                placeholder="10"
              />
              {errors.minStockLevel && <p className="text-red-600 text-sm mt-1">{errors.minStockLevel.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input {...register("barcode")} type="text" className="input" placeholder="Enter barcode" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input {...register("supplier")} type="text" className="input" placeholder="Enter supplier name" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              className="input resize-none"
              placeholder="Enter product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input {...register("image")} type="file" accept="image/*" className="input" />
              </div>
              {imagePreview && (
                <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4 py-2 disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {product ? "Updating..." : "Creating..."}
                </div>
              ) : product ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal
