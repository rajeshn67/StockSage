const express = require("express")
const Bill = require("../models/Bill")
const Product = require("../models/Product")
const auth = require("../middleware/auth")

const router = express.Router()

// Generate bill number
const generateBillNumber = () => {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `BILL-${timestamp.slice(-6)}${random}`
}

// Create new bill
router.post("/", auth, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      tax = 0,
      discount = 0,
      paymentMethod = "cash",
    } = req.body

    // Validate and calculate totals
    let subtotal = 0
    const billItems = []

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        userId: req.user._id,
      })

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.productName}`,
        })
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
        })
      }

      const itemTotal = item.quantity * item.price
      subtotal += itemTotal

      billItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
      })
    }

    const total = subtotal + tax - discount

    // Create bill
    const bill = new Bill({
      billNumber: generateBillNumber(),
      customerName,
      customerPhone,
      customerEmail,
      items: billItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      userId: req.user._id,
    })

    await bill.save()

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } })
    }

    res.status(201).json({
      message: "Bill created successfully",
      bill,
    })
  } catch (error) {
    console.error("Create bill error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all bills
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", startDate = "", endDate = "", search = "" } = req.query;

    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { billNumber: { $regex: search, $options: "i" } }
      ];
    }

    const bills = await Bill.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Bill.countDocuments(query);

    res.json({
      bills,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error("Get bills error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single bill
router.get("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" })
    }

    res.json(bill)
  } catch (error) {
    console.error("Get bill error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update bill status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body

    if (!["paid", "pending", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const bill = await Bill.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { status }, { new: true })

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" })
    }

    res.json({
      message: "Bill status updated successfully",
      bill,
    })
  } catch (error) {
    console.error("Update bill status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
