"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { Plus, Search, Download, FileText } from "lucide-react"
import { fetchBills, updateBillStatus } from "../store/slices/billSlice"
import { formatCurrency, formatDate } from "../utils/currency"
import { getBillStatusColor } from "../utils/helpers"
import toast from "react-hot-toast"

const Bills = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  const dispatch = useDispatch()
  const { bills, totalPages, total, loading, error } = useSelector((state) => state.bills)

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
    }

    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    if (dateRange.start && dateRange.end) {
      params.startDate = dateRange.start;
      params.endDate = dateRange.end;
    }

    dispatch(fetchBills(params));
  }, [dispatch, currentPage, statusFilter, dateRange, searchTerm])

  const handleStatusUpdate = async (billId, newStatus) => {
    try {
      const result = await dispatch(updateBillStatus({ id: billId, status: newStatus }))
      if (updateBillStatus.fulfilled.match(result)) {
        toast.success("Bill status updated successfully!")
      } else {
        toast.error(result.payload || "Failed to update bill status")
      }
    } catch (error) {
      toast.error("Failed to update bill status")
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const printBill = (bill) => {
    const printWindow = window.open("", "_blank")
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill ${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .bill-info { margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .text-right { text-align: right; }
            .currency { font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Stock-Sage</h1>
            <h2>Invoice</h2>
          </div>
          
          <div class="bill-info">
            <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
            <p><strong>Date:</strong> ${formatDate(bill.createdAt)}</p>
            <p><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</p>
          </div>
          
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${bill.customerName}</p>
            ${bill.customerPhone ? `<p><strong>Phone:</strong> ${bill.customerPhone}</p>` : ""}
            ${bill.customerEmail ? `<p><strong>Email:</strong> ${bill.customerEmail}</p>` : ""}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td class="currency">${formatCurrency(item.price)}</td>
                  <td class="currency">${formatCurrency(item.total)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <table>
            <tr>
              <td class="text-right"><strong>Subtotal:</strong></td>
              <td class="text-right currency">${formatCurrency(bill.subtotal)}</td>
            </tr>
            <tr>
              <td class="text-right"><strong>Tax:</strong></td>
              <td class="text-right currency">${formatCurrency(bill.tax)}</td>
            </tr>
            <tr>
              <td class="text-right"><strong>Discount:</strong></td>
              <td class="text-right currency">-${formatCurrency(bill.discount)}</td>
            </tr>
            <tr class="total-row">
              <td class="text-right"><strong>Total:</strong></td>
              <td class="text-right currency">${formatCurrency(bill.total)}</td>
            </tr>
          </table>
          
          <div style="margin-top: 30px; text-align: center;">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading bills: {error}</div>
        <button onClick={() => dispatch(fetchBills())} className="btn btn-primary">
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
          <h1 className="text-2xl font-bold text-gray-900">Bills & Invoices</h1>
          <p className="text-gray-600">Manage customer bills and track payments</p>
        </div>
        <Link to="/bills/create" className="btn btn-primary px-4 py-2 text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Bill
        </Link>
      </div>

      {/* Filters */}
      <div className="card card-content p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter || dateRange.start ? "Try adjusting your filters" : "Get started by creating your first bill"}
          </p>
          <Link to="/bills/create" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bill.billNumber}</div>
                          <div className="text-sm text-gray-500">{formatDate(bill.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                          {bill.customerPhone && <div className="text-sm text-gray-500">{bill.customerPhone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 currency">{formatCurrency(bill.total)}</div>
                        <div className="text-sm text-gray-500">{bill.items.length} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={bill.status}
                          onChange={(e) => handleStatusUpdate(bill._id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getBillStatusColor(bill.status)}`}
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {bill.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => printBill(bill)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Print Bill"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {bills.map((bill) => (
              <div key={bill._id} className="card card-content p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{bill.billNumber}</h3>
                    <p className="text-sm text-gray-600">{formatDate(bill.createdAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => printBill(bill)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Print Bill"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Customer:</span>
                    <span className="text-sm font-medium text-gray-900">{bill.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium text-gray-900 currency">{formatCurrency(bill.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Items:</span>
                    <span className="text-sm text-gray-900">{bill.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment:</span>
                    <span className="text-sm text-gray-900 capitalize">{bill.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <select
                      value={bill.status}
                      onChange={(e) => handleStatusUpdate(bill._id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getBillStatusColor(bill.status)}`}
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  )
}

export default Bills
