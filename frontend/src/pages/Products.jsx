"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Plus, Search, Filter, Edit, Trash2, Package } from "lucide-react"
import { fetchProducts, deleteProduct, fetchCategories } from "../store/slices/productSlice"
import { formatCurrency } from "../utils/currency"
import ProductModal from "../components/ProductModal"
import toast from "react-hot-toast"

const Products = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  // New filter states
  const [stockStatus, setStockStatus] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  // Local filter state for Apply Filters
  const [pendingStockStatus, setPendingStockStatus] = useState("");
  const [pendingMinPrice, setPendingMinPrice] = useState("");
  const [pendingMaxPrice, setPendingMaxPrice] = useState("");

  const dispatch = useDispatch()
  const { products, categories, totalPages, total, loading, error } = useSelector((state) => state.products)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch products when search, category, or page changes
  const fetchProductsData = useCallback(() => {
    dispatch(
      fetchProducts({
        search: debouncedSearchTerm,
        category: selectedCategory,
        page: currentPage,
        limit: 10,
        stockStatus,
        minPrice: minPrice !== "" ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
      }),
    )
  }, [dispatch, debouncedSearchTerm, selectedCategory, currentPage, stockStatus, minPrice, maxPrice])

  // Only update stockStatus/minPrice/maxPrice when Apply Filters is clicked
  const handleApplyFilters = () => {
    setStockStatus(pendingStockStatus);
    setMinPrice(pendingMinPrice);
    setMaxPrice(pendingMaxPrice);
    setCurrentPage(1);
  }

  // Fetch categories once on component mount
  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProductsData()
  }, [fetchProductsData])

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        const result = await dispatch(deleteProduct(product._id))
        if (deleteProduct.fulfilled.match(result)) {
          toast.success("Product deleted successfully!")
        } else {
          toast.error(result.payload || "Failed to delete product")
        }
      } catch (error) {
        toast.error("Failed to delete product")
      }
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { text: "Out of Stock", color: "text-red-600 bg-red-100" }
    if (quantity <= minStock) return { text: "Low Stock", color: "text-yellow-600 bg-yellow-100" }
    return { text: "In Stock", color: "text-green-600 bg-green-100" }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading products: {error}</div>
        <button onClick={fetchProductsData} className="btn btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your inventory and product catalog</p>
        </div>
        <button onClick={handleAddProduct} className="btn btn-primary px-4 py-2 text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card card-content p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="input pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select value={selectedCategory} onChange={handleCategoryChange} className="input min-w-[150px]">
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary px-3 py-2">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                <select className="input" value={pendingStockStatus} onChange={e => setPendingStockStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" className="input" value={pendingMinPrice} onChange={e => setPendingMinPrice(e.target.value)} />
                  <input type="number" placeholder="Max" className="input" value={pendingMaxPrice} onChange={e => setPendingMaxPrice(e.target.value)} />
                </div>
              </div>
              <div className="flex items-end">
                <button className="btn btn-secondary w-full" onClick={handleApplyFilters} type="button">Apply Filters</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid/Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          <button onClick={handleAddProduct} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.quantity, product.minStockLevel)
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {product.image ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 currency">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}
                          >
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {products.map((product) => {
              const stockStatus = getStockStatus(product.quantity, product.minStockLevel)
              return (
                <div key={product._id} className="card card-content p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {product.image ? (
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex space-x-4">
                          <span className="text-lg font-semibold text-gray-900 currency">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-sm text-gray-600">Stock: {product.quantity}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary px-3 py-2 disabled:opacity-50"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? "bg-primary-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary px-3 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        categories={categories}
      />
    </div>
  )
}

export default Products
