"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { Plus, Minus, Search, Trash2, Calculator, User, Phone, Mail } from "lucide-react"
import { fetchProducts } from "../store/slices/productSlice"
import { createBill } from "../store/slices/billSlice"
import { formatCurrency, numberToWords } from "../utils/currency"
import { debounce } from "../utils/helpers"
import toast from "react-hot-toast"

const CreateBill = () => {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [billItems, setBillItems] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { products } = useSelector((state) => state.products)

  // Debounced search for products
  const debouncedSearch = debounce((term) => {
    if (term.length > 0) {
      dispatch(fetchProducts({ search: term, limit: 10 }))
      setShowSearch(true)
    } else {
      setShowSearch(false)
    }
  }, 300)

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  useEffect(() => {
    setSearchResults(products)
  }, [products])

  const addProductToBill = (product) => {
    const existingItem = billItems.find((item) => item.productId === product._id)

    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error(`Only ${product.quantity} units available in stock`)
        return
      }
      setBillItems(
        billItems.map((item) => (item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      if (product.quantity === 0) {
        toast.error("Product is out of stock")
        return
      }
      setBillItems([
        ...billItems,
        {
          productId: product._id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          maxQuantity: product.quantity,
        },
      ])
    }
    setSearchTerm("")
    setShowSearch(false)
  }

  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromBill(productId)
      return
    }

    const item = billItems.find((item) => item.productId === productId)
    if (newQuantity > item.maxQuantity) {
      toast.error(`Only ${item.maxQuantity} units available in stock`)
      return
    }

    setBillItems(billItems.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItemFromBill = (productId) => {
    setBillItems(billItems.filter((item) => item.productId !== productId))
  }

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + tax - discount
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!customerInfo.name.trim()) {
      toast.error("Customer name is required")
      return
    }

    if (billItems.length === 0) {
      toast.error("Please add at least one item to the bill")
      return
    }

    const total = calculateTotal()
    if (total <= 0) {
      toast.error("Bill total must be greater than zero")
      return
    }

    setIsSubmitting(true)

    try {
      const billData = {
        customerName: customerInfo.name.trim(),
        customerPhone: customerInfo.phone.trim(),
        customerEmail: customerInfo.email.trim(),
        items: billItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        tax: Number.parseFloat(tax) || 0,
        discount: Number.parseFloat(discount) || 0,
        paymentMethod,
      }

      const result = await dispatch(createBill(billData))

      if (createBill.fulfilled.match(result)) {
        toast.success("Bill created successfully!")
        navigate("/bills")
      } else {
        toast.error(result.payload || "Failed to create bill")
      }
    } catch (error) {
      toast.error("Failed to create bill")
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtotal = calculateSubtotal()
  const total = calculateTotal()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Bill</h1>
          <p className="text-gray-600">Generate invoice for customer purchase</p>
        </div>
        <button onClick={() => navigate("/bills")} className="btn btn-secondary px-4 py-2 text-sm">
          Back to Bills
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="input"
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="input pl-10"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="input pl-10"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Search */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Add Products</h2>
          </div>
          <div className="card-content">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                placeholder="Search products to add to bill..."
              />

              {/* Search Results Dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => addProductToBill(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 currency">{formatCurrency(product.price)}</p>
                          <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill Items */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Bill Items</h2>
          </div>
          <div className="card-content">
            {billItems.length === 0 ? (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No items added to bill</p>
                <p className="text-sm text-gray-400">Search and add products above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">Product</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-700">Quantity</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">Price</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">Total</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item) => (
                        <tr key={item.productId} className="border-b border-gray-100">
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-600">Max: {item.maxQuantity}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                className="p-1 rounded-md hover:bg-gray-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, Number.parseInt(e.target.value))}
                                className="w-16 text-center border border-gray-300 rounded-md py-1"
                                min="1"
                                max={item.maxQuantity}
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                className="p-1 rounded-md hover:bg-gray-100"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right currency">{formatCurrency(item.price)}</td>
                          <td className="py-3 text-right font-medium currency">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemFromBill(item.productId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {billItems.map((item) => (
                    <div key={item.productId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">Max: {item.maxQuantity}</p>
                          <p className="text-sm text-gray-600 currency">{formatCurrency(item.price)} each</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemFromBill(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                            className="p-1 rounded-md hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.productId, Number.parseInt(e.target.value))}
                            className="w-16 text-center border border-gray-300 rounded-md py-1"
                            min="1"
                            max={item.maxQuantity}
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                            className="p-1 rounded-md hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-medium currency">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bill Summary */}
        {billItems.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">Bill Summary</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Additional Charges */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount (₹)</label>
                    <input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(Number.parseFloat(e.target.value) || 0)}
                      className="input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (₹)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                      className="input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                </div>

                {/* Right Column - Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium currency">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium currency">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium currency">-{formatCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900 currency">{formatCurrency(total)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Amount in words:</strong> {numberToWords(Math.floor(total))} Rupees Only
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/bills")}
            className="btn btn-secondary px-6 py-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary px-6 py-2 disabled:opacity-50"
            disabled={isSubmitting || billItems.length === 0}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="loading-spinner mr-2"></div>
                Creating Bill...
              </div>
            ) : (
              "Create Bill"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateBill
