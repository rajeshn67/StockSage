"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { TrendingUp, TrendingDown, DollarSign, Package, Users } from "lucide-react"
import { fetchDashboardAnalytics, fetchSalesReport } from "../store/slices/analyticsSlice"
import { formatCurrency, formatNumber } from "../utils/currency"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

const Analytics = () => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  })
  const [groupBy, setGroupBy] = useState("day")

  const dispatch = useDispatch()
  const { dashboardData, salesReport, loading } = useSelector((state) => state.analytics)

  useEffect(() => {
    dispatch(fetchDashboardAnalytics())
  }, [dispatch])

  useEffect(() => {
    dispatch(
      fetchSalesReport({
        startDate: dateRange.start,
        endDate: dateRange.end,
        groupBy,
      }),
    )
  }, [dispatch, dateRange, groupBy])

  const handleDateRangeChange = (range) => {
    const today = new Date()
    let start, end

    switch (range) {
      case "today":
        start = end = format(today, "yyyy-MM-dd")
        break
      case "week":
        start = format(subDays(today, 7), "yyyy-MM-dd")
        end = format(today, "yyyy-MM-dd")
        break
      case "month":
        start = format(startOfMonth(today), "yyyy-MM-dd")
        end = format(endOfMonth(today), "yyyy-MM-dd")
        break
      case "quarter":
        start = format(subDays(today, 90), "yyyy-MM-dd")
        end = format(today, "yyyy-MM-dd")
        break
      default:
        return
    }

    setDateRange({ start, end })
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  const topProductsData = dashboardData.topProducts.map((product, index) => ({
    ...product,
    fill: COLORS[index % COLORS.length],
  }))

  const salesTrendData = salesReport.map((item) => ({
    ...item,
    date: item._id,
    sales: item.totalSales,
    orders: item.totalOrders,
    avgOrder: item.averageOrderValue,
  }))

  const stats = [
    {
      name: "Total Revenue",
      value: formatCurrency(dashboardData.monthlySales.total),
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      name: "Total Orders",
      value: formatNumber(dashboardData.monthlySales.count),
      icon: Package,
      color: "bg-blue-500",
    },
    {
      name: "Average Order",
      value: formatCurrency(
        dashboardData.monthlySales.count > 0 ? dashboardData.monthlySales.total / dashboardData.monthlySales.count : 0,
      ),
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      name: "Products Sold",
      value: formatNumber(dashboardData.topProducts.reduce((sum, product) => sum + product.totalSold, 0)),
      icon: Users,
      color: "bg-orange-500",
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleDateRangeChange("today")} className="btn btn-secondary px-3 py-2 text-sm">
            Today
          </button>
          <button onClick={() => handleDateRangeChange("week")} className="btn btn-secondary px-3 py-2 text-sm">
            Week
          </button>
          <button onClick={() => handleDateRangeChange("month")} className="btn btn-secondary px-3 py-2 text-sm">
            Month
          </button>
          <button onClick={() => handleDateRangeChange("quarter")} className="btn btn-secondary px-3 py-2 text-sm">
            Quarter
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card card-content p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="input">
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary w-full">Apply Filters</button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card card-content p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "MMM dd")} />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "sales" ? formatCurrency(value) : formatNumber(value),
                      name === "sales" ? "Sales" : "Orders",
                    ]}
                    labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Orders Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Orders Trend</h3>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "MMM dd")} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatNumber(value), "Orders"]}
                    labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                  />
                  <Bar dataKey="orders" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Products by Revenue</h3>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ productName, percent }) => `${productName} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Average Order Value</h3>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "MMM dd")} />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Avg Order Value"]}
                    labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                  />
                  <Line type="monotone" dataKey="avgOrder" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.topProducts.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {index + 1}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.totalSold)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 currency">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 currency">
                      {formatCurrency(product.revenue / product.totalSold)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
