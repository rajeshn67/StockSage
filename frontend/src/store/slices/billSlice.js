import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../utils/api"

// Async thunks
export const createBill = createAsyncThunk("bills/createBill", async (billData, { rejectWithValue }) => {
  try {
    const response = await api.post("/bills", billData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create bill")
  }
})

export const fetchBills = createAsyncThunk("bills/fetchBills", async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get("/bills", { params })
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch bills")
  }
})

export const fetchBill = createAsyncThunk("bills/fetchBill", async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/bills/${id}`)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch bill")
  }
})

export const updateBillStatus = createAsyncThunk(
  "bills/updateBillStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/bills/${id}/status`, { status })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update bill status")
    }
  },
)

const billSlice = createSlice({
  name: "bills",
  initialState: {
    bills: [],
    currentBill: null,
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
    clearCurrentBill: (state) => {
      state.currentBill = null
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Bill
      .addCase(createBill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.loading = false
        state.bills.unshift(action.payload.bill)
        state.total += 1
      })
      .addCase(createBill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Bills
      .addCase(fetchBills.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.loading = false
        state.bills = action.payload.bills
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.currentPage
        state.total = action.payload.total
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Bill
      .addCase(fetchBill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBill.fulfilled, (state, action) => {
        state.loading = false
        state.currentBill = action.payload
      })
      .addCase(fetchBill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Bill Status
      .addCase(updateBillStatus.fulfilled, (state, action) => {
        const index = state.bills.findIndex((b) => b._id === action.payload.bill._id)
        if (index !== -1) {
          state.bills[index] = action.payload.bill
        }
        if (state.currentBill && state.currentBill._id === action.payload.bill._id) {
          state.currentBill = action.payload.bill
        }
      })
  },
})

export const { clearError, clearCurrentBill, setCurrentPage } = billSlice.actions
export default billSlice.reducer
