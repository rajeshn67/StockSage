import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import productSlice from "./slices/productSlice"
import billSlice from "./slices/billSlice"
import analyticsSlice from "./slices/analyticsSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    products: productSlice,
    bills: billSlice,
    analytics: analyticsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})
