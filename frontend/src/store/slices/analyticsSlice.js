import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../utils/api"

// Async thunks
export const fetchDashboardAnalytics = createAsyncThunk(
  "analytics/fetchDashboardAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/analytics/dashboard")
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch analytics")
    }
  },
)

export const fetchSalesReport = createAsyncThunk(
  "analytics/fetchSalesReport",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/analytics/sales-report", { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch sales report")
    }
  },
)

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    dashboardData: {
      totalProducts: 0,
      lowStockProducts: 0,
      todaysSales: { total: 0, count: 0 },
      monthlySales: { total: 0, count: 0 },
      topProducts: [],
      recentBills: [],
      salesTrend: [],
    },
    salesReport: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardData = action.payload
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Sales Report
      .addCase(fetchSalesReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.loading = false
        state.salesReport = action.payload
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = analyticsSlice.actions
export default analyticsSlice.reducer
