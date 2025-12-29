import { browser } from '../shared/browser.js';

document.addEventListener("DOMContentLoaded", () => {
  const resultsContent = document.getElementById("results-content")

  // Get optimization results from background script
  browser.runtime
    .sendMessage({ action: "getOptimizationResults" })
    .then((response) => {
      if (response.success) {
        renderResults(response.result)
      } else {
        showError(response.error || "Failed to load optimization results")
      }
    })
    .catch((error) => {
      showError(error.message || "An unexpected error occurred")
    })

  function renderResults(result) {
    // Clear loading indicator
    resultsContent.innerHTML = ""

    // Create summary section
    const summary = document.createElement("div")
    summary.className = "summary"
    summary.innerHTML = `
      <h2>Optimization Summary</h2>
      <div class="summary-details">
        <div class="summary-item">
          <h3>Total Cost</h3>
          <p>${formatCurrency(result.totalCost)}</p>
        </div>
        <div class="summary-item">
          <h3>Products</h3>
          <p>${result.totalProducts}</p>
        </div>
        <div class="summary-item">
          <h3>Sellers</h3>
          <p>${result.purchases.length}</p>
        </div>
        <div class="summary-item">
          <h3>Savings</h3>
          <p>${formatCurrency(result.savings)}</p>
        </div>
      </div>
    `
    resultsContent.appendChild(summary)

    // Create purchases section
    const purchases = document.createElement("div")
    purchases.className = "purchases"
    purchases.innerHTML = `
      <h2>Recommended Purchases</h2>
      ${result.purchases
        .map(
          (purchase) => `
        <div class="seller-purchase">
          <h3>${purchase.seller}</h3>
          <table class="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.products
                .map(
                  (product) => `
                <tr>
                  <td>${product.name}</td>
                  <td>${formatCurrency(product.price)}</td>
                  <td><a href="${product.url}" target="_blank">View</a></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="seller-total">
            Subtotal: ${formatCurrency(purchase.subtotal)} | 
            Shipping: ${formatCurrency(purchase.shipping)} | 
            Total: ${formatCurrency(purchase.total)}
          </div>
        </div>
      `,
        )
        .join("")}
    `
    resultsContent.appendChild(purchases)

    // Create alternatives section if available
    if (result.alternatives && result.alternatives.length > 0) {
      const alternatives = document.createElement("div")
      alternatives.className = "alternatives"
      alternatives.innerHTML = `
        <h2>Alternative Options</h2>
        ${result.alternatives
          .map(
            (alt) => `
          <div class="alternative-item">
            <h3>${alt.description}</h3>
            <p>Total Cost: ${formatCurrency(alt.totalCost)}</p>
            <p class="price-difference ${alt.priceDifference > 0 ? "positive" : "negative"}">
              Difference: ${formatCurrency(alt.priceDifference)}
            </p>
            <p>${alt.explanation}</p>
          </div>
        `,
          )
          .join("")}
      `
      resultsContent.appendChild(alternatives)
    }

    // Add action buttons
    const actions = document.createElement("div")
    actions.className = "actions"
    actions.innerHTML = `
      <button class="btn" id="export-button">Export Results</button>
      <button class="btn btn-secondary" id="back-button">Back to Extension</button>
    `
    resultsContent.appendChild(actions)

    // Add event listeners
    document.getElementById("export-button").addEventListener("click", () => {
      exportResults(result)
    })

    document.getElementById("back-button").addEventListener("click", () => {
      browser.sidebarAction.open()
    })
  }

  function showError(message) {
    resultsContent.innerHTML = `
      <div class="error">
        <h2>Error</h2>
        <p>${message}</p>
        <button class="btn btn-secondary" id="back-button">Back to Extension</button>
      </div>
    `

    document.getElementById("back-button").addEventListener("click", () => {
      browser.sidebarAction.open()
    })
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  function exportResults(result) {
    // Create CSV content
    let csv = "Seller,Product,Price,URL\n"

    result.purchases.forEach((purchase) => {
      purchase.products.forEach((product) => {
        csv += `"${purchase.seller}","${product.name}","${product.price}","${product.url}"\n`
      })
    })

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "buy4least_results.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
})
