import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../utils/api"

// Async thunks
export const fetchProducts = createAsyncThunk("products/fetchProducts", async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get("/products", { params })
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch products")
  }
})

export const createProduct = createAsyncThunk("products/createProduct", async (productData, { rejectWithValue }) => {
  try {
    const formData = new FormData()
    Object.keys(productData).forEach((key) => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key])
      }
    })

    const response = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create product")
  }
})

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      Object.keys(productData).forEach((key) => {
        if (productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key])
        }
      })

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update product")
    }
  },
)

export const deleteProduct = createAsyncThunk("products/deleteProduct", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete product")
  }
})

export const fetchCategories = createAsyncThunk("products/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/products/categories/list")
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch categories")
  }
})

export const fetchLowStockProducts = createAsyncThunk(
  "products/fetchLowStockProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/products/alerts/low-stock")
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch low stock products")
    }
  },
)

const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    categories: [],
    lowStockProducts: [],
    totalPages: 0,
    currentPage: 1,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.products
        state.totalPages = action.payload.totalPages
        state.currentPage = Number(action.payload.currentPage)
        state.total = action.payload.total
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products = [action.payload.product, ...state.products]
        state.total += 1
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false
        const index = state.products.findIndex((p) => p._id === action.payload.product._id)
        if (index !== -1) {
          state.products[index] = action.payload.product
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false
        state.products = state.products.filter((p) => p._id !== action.payload)
        state.total -= 1
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
      // Fetch Low Stock Products
      .addCase(fetchLowStockProducts.fulfilled, (state, action) => {
        state.lowStockProducts = action.payload
      })
  },
})

export const { clearError, setCurrentPage } = productSlice.actions
export default productSlice.reducer
