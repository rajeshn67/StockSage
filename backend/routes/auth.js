const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, shopName, phone, address } = req.body

    // Validate required fields
    if (!name || !email || !password || !shopName || !phone || !address) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      shopName: shopName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    })

    await user.save()

    // Generate JWT token
    const token = generateToken(user._id)

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        address: user.address,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ message: messages.join(", ") })
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" })
    }

    res.status(500).json({ message: "Server error during registration" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true })
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // Generate JWT token
    const token = generateToken(user._id)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        address: user.address,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        shopName: req.user.shopName,
        phone: req.user.phone,
        address: req.user.address,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, shopName, phone, address, password, oldPassword } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (shopName) updateData.shopName = shopName.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();

    let user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If password change requested
    if (password) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password is required to change password" });
      }
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
      user.password = password;
    }

    // Update other fields
    Object.assign(user, updateData);
    await user.save();

    res.json({
      message: password ? "Password and profile updated successfully" : "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ message: messages.join(", ") })
    }

    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
