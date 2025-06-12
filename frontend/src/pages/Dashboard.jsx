"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { Package, AlertTriangle, TrendingUp, IndianRupee, ShoppingCart, Plus, Eye } from "lucide-react"
import { fetchDashboardAnalytics } from "../store/slices/analyticsSlice"
import { fetchLowStockProducts } from "../store/slices/productSlice"
import { formatCurrency, formatNumber } from "../utils/currency"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const Dashboard = () => {
  const dispatch = useDispatch()
  const { dashboardData, loading } = useSelector((state) => state.analytics)
  const { lowStockProducts } = useSelector((state) => state.products)

  useEffect(() => {
    dispatch(fetchDashboardAnalytics())
    dispatch(fetchLowStockProducts())
  }, [dispatch])

  const stats = [
    {
      name: "Total Products",
      value: formatNumber(dashboardData.totalProducts),
      icon: Package,
      color: "bg-blue-500",
      href: "/products",
    },
    {
      name: "Low Stock Alerts",
      value: formatNumber(dashboardData.lowStockProducts),
      icon: AlertTriangle,
      color: "bg-red-500",
      href: "/products?filter=low-stock",
    },
    {
      name: "Today's Sales",
      value: formatCurrency(dashboardData.todaysSales.total),
      icon: IndianRupee,
      color: "bg-green-500",
      href: "/bills",
    },
    {
      name: "Monthly Sales",
      value: formatCurrency(dashboardData.monthlySales.total),
      icon: TrendingUp,
      color: "bg-purple-500",
      href: "/analytics",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/products" className="btn btn-secondary px-4 py-2 text-sm">
            <Package className="h-4 w-4 mr-2" />
            Manage Products
          </Link>
          <Link to="/bills/create" className="btn btn-primary px-4 py-2 text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.href} className="card card-content p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales Trend (Last 7 Days)</h3>
          </div>
          <div className="card-content">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tickFormatter={(value) => format(new Date(value), "MMM dd")} />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Sales"]}
                    labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="card-content">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="productName"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "totalSold" ? `${value} units` : formatCurrency(value),
                      name === "totalSold" ? "Units Sold" : "Revenue",
                    ]}
                  />
                  <Bar dataKey="totalSold" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Bills</h3>
            <Link to="/bills" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {dashboardData.recentBills.length > 0 ? (
                dashboardData.recentBills.map((bill) => (
                  <div key={bill._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{bill.billNumber}</p>
                      <p className="text-sm text-gray-600">{bill.customerName}</p>
                      <p className="text-xs text-gray-500">{format(new Date(bill.createdAt), "MMM dd, yyyy HH:mm")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 currency">{formatCurrency(bill.total)}</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          bill.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : bill.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent bills</p>
                  <Link to="/bills/create" className="text-primary-600 hover:text-primary-500 text-sm">
                    Create your first bill
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
            <Link to="/products" className="text-sm text-primary-600 hover:text-primary-500">
              Manage stock
            </Link>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{product.quantity} left</p>
                      <p className="text-xs text-gray-500">Min: {product.minStockLevel}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">All products are well stocked</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/products"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">Add New Product</p>
                <p className="text-sm text-gray-600">Expand your inventory</p>
              </div>
            </Link>

            <Link
              to="/bills/create"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">Create Bill</p>
                <p className="text-sm text-gray-600">Generate new invoice</p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Track your performance</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
