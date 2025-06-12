const express = require("express")
const Bill = require("../models/Bill")
const Product = require("../models/Product")
const auth = require("../middleware/auth")

const router = express.Router()

// Get dashboard analytics
router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = req.user._id
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Total products
    const totalProducts = await Product.countDocuments({ userId })

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      userId,
      $expr: { $lte: ["$quantity", "$minStockLevel"] },
    })

    // Today's sales
    const todaysSales = await Bill.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startOfDay },
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ])

    // Monthly sales
    const monthlySales = await Bill.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startOfMonth },
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ])

    // Top selling products
    const topProducts = await Bill.aggregate([
      { $match: { userId, status: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ])

    // Recent bills
    const recentBills = await Bill.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("billNumber customerName total status createdAt")

    // Sales trend (last 7 days)
    const salesTrend = await Bill.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: "paid",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          sales: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.json({
      totalProducts,
      lowStockProducts,
      todaysSales: todaysSales[0] || { total: 0, count: 0 },
      monthlySales: monthlySales[0] || { total: 0, count: 0 },
      topProducts,
      recentBills,
      salesTrend,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get sales report
router.get("/sales-report", auth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query
    const userId = req.user._id

    const matchStage = { userId, status: "paid" }

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    let groupFormat
    switch (groupBy) {
      case "month":
        groupFormat = "%Y-%m"
        break
      case "week":
        groupFormat = "%Y-%U"
        break
      default:
        groupFormat = "%Y-%m-%d"
    }

    const salesReport = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$createdAt" },
          },
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.json(salesReport)
  } catch (error) {
    console.error("Sales report error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
