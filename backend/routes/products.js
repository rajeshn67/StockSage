const express = require("express")
const Product = require("../models/Product")
const auth = require("../middleware/auth")
const { upload } = require("../config/cloudinary")

const router = express.Router()

// Get all products for authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category = "", stockStatus = "", minPrice = "", maxPrice = "" } = req.query;

    const query = { userId: req.user._id, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    // Stock Status filter
    if (stockStatus === "in-stock") {
      query.quantity = { $gt: 0 };
    } else if (stockStatus === "low-stock") {
      // Will filter after query since $expr is not supported in .find()
      // We'll do this in-memory for now
    } else if (stockStatus === "out-of-stock") {
      query.quantity = 0;
    }

    // Price range filter
    if (minPrice !== "") {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }
    if (maxPrice !== "") {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    let products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Low stock filter (in-memory, if needed)
    if (stockStatus === "low-stock") {
      products = products.filter(p => p.quantity <= (p.minStockLevel || 10) && p.quantity > 0);
    }

    // Get total count for pagination
    let total = await Product.countDocuments(query);
    if (stockStatus === "low-stock") {
      const allProducts = await Product.find(query);
      total = allProducts.filter(p => p.quantity <= (p.minStockLevel || 10) && p.quantity > 0).length;
    }

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single product
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create new product
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, price, costPrice, quantity, minStockLevel, barcode, supplier } = req.body

    // Validate required fields
    if (!name || !category || !price || !costPrice || quantity === undefined) {
      return res.status(400).json({ message: "Required fields are missing" })
    }

    const productData = {
      name: name.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      price: Number.parseFloat(price),
      costPrice: Number.parseFloat(costPrice),
      quantity: Number.parseInt(quantity),
      minStockLevel: Number.parseInt(minStockLevel) || 10,
      barcode: barcode?.trim() || "",
      supplier: supplier?.trim() || "",
      userId: req.user._id,
    }

    if (req.file) {
      productData.image = req.file.path
    }

    const product = new Product(productData)
    await product.save()

    res.status(201).json({
      message: "Product created successfully",
      product,
    })
  } catch (error) {
    console.error("Create product error:", error)
    if (error.code === 11000) {
      res.status(400).json({ message: "Barcode already exists" })
    } else if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      res.status(400).json({ message: messages.join(", ") })
    } else {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// Update product
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, price, costPrice, quantity, minStockLevel, barcode, supplier } = req.body

    const updateData = {
      name: name?.trim(),
      description: description?.trim() || "",
      category: category?.trim(),
      price: Number.parseFloat(price),
      costPrice: Number.parseFloat(costPrice),
      quantity: Number.parseInt(quantity),
      minStockLevel: Number.parseInt(minStockLevel) || 10,
      barcode: barcode?.trim() || "",
      supplier: supplier?.trim() || "",
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key]
      }
    })

    if (req.file) {
      updateData.image = req.file.path
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isActive: true },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({
      message: "Product updated successfully",
      product,
    })
  } catch (error) {
    console.error("Update product error:", error)
    if (error.code === 11000) {
      res.status(400).json({ message: "Barcode already exists" })
    } else if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      res.status(400).json({ message: messages.join(", ") })
    } else {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// Delete product (soft delete)
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
        isActive: true,
      },
      { isActive: false },
      { new: true },
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get categories
router.get("/categories/list", auth, async (req, res) => {
  try {
    const categories = await Product.distinct("category", { userId: req.user._id, isActive: true })
    res.json(categories)
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get low stock products
router.get("/alerts/low-stock", auth, async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.user._id,
      isActive: true,
      $expr: { $lte: ["$quantity", "$minStockLevel"] },
    }).sort({ quantity: 1 })

    res.json(products)
  } catch (error) {
    console.error("Get low stock error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update product quantity (for inventory adjustments)
router.patch("/:id/quantity", auth, async (req, res) => {
  try {
    const { quantity, operation = "set" } = req.body

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: "Valid quantity is required" })
    }

    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    let newQuantity
    switch (operation) {
      case "add":
        newQuantity = product.quantity + Number.parseInt(quantity)
        break
      case "subtract":
        newQuantity = Math.max(0, product.quantity - Number.parseInt(quantity))
        break
      case "set":
      default:
        newQuantity = Number.parseInt(quantity)
        break
    }

    product.quantity = newQuantity
    await product.save()

    res.json({
      message: "Product quantity updated successfully",
      product,
    })
  } catch (error) {
    console.error("Update quantity error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Bulk update quantities (for bill processing)
router.patch("/bulk/quantity", auth, async (req, res) => {
  try {
    const { updates } = req.body // Array of { productId, quantity, operation }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Updates array is required" })
    }

    const results = []

    for (const update of updates) {
      const { productId, quantity, operation = "subtract" } = update

      const product = await Product.findOne({
        _id: productId,
        userId: req.user._id,
        isActive: true,
      })

      if (!product) {
        results.push({ productId, success: false, message: "Product not found" })
        continue
      }

      let newQuantity
      switch (operation) {
        case "add":
          newQuantity = product.quantity + Number.parseInt(quantity)
          break
        case "subtract":
          newQuantity = Math.max(0, product.quantity - Number.parseInt(quantity))
          break
        case "set":
        default:
          newQuantity = Number.parseInt(quantity)
          break
      }

      product.quantity = newQuantity
      await product.save()

      results.push({ productId, success: true, newQuantity })
    }

    res.json({
      message: "Bulk quantity update completed",
      results,
    })
  } catch (error) {
    console.error("Bulk update error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
