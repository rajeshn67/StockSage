// Indian currency formatter
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

// Format number with Indian numbering system
export const formatNumber = (number) => {
  return new Intl.NumberFormat("en-IN").format(number || 0)
}

// Convert number to words (for bills)
export const numberToWords = (num) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  if (num === 0) return "Zero"

  const convertHundreds = (n) => {
    let result = ""
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred "
      n %= 100
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " "
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + " "
      return result
    }
    if (n > 0) {
      result += ones[n] + " "
    }
    return result
  }

  let result = ""
  const crore = Math.floor(num / 10000000)
  if (crore > 0) {
    result += convertHundreds(crore) + "Crore "
    num %= 10000000
  }

  const lakh = Math.floor(num / 100000)
  if (lakh > 0) {
    result += convertHundreds(lakh) + "Lakh "
    num %= 100000
  }

  const thousand = Math.floor(num / 1000)
  if (thousand > 0) {
    result += convertHundreds(thousand) + "Thousand "
    num %= 1000
  }

  if (num > 0) {
    result += convertHundreds(num)
  }

  return result.trim()
}

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
