"use client"

import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { checkAuth } from "./store/slices/authSlice"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import Bills from "./pages/Bills"
import Analytics from "./pages/Analytics"
import CreateBill from "./pages/CreateBill"
import Profile from "./pages/Profile"
import LoadingSpinner from "./components/LoadingSpinner"
import ErrorBoundary from "./components/ErrorBoundary"
import TestStyles from "./components/TestStyles"

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  // Temporary test - remove this after confirming styles work
  if (window.location.search.includes("test")) {
    return <TestStyles />
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="bills" element={<Bills />} />
          <Route path="bills/create" element={<CreateBill />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
