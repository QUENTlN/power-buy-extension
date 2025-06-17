// Declare browser variable for cross-browser compatibility
const browser = browser || chrome

// Listen for scrape command from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "scrape") {
    const pageData = scrapeCurrentPage()
    browser.runtime.sendMessage({
      action: "scrapedData",
      data: pageData,
    })
  }
})

// Scrape the current page
function scrapeCurrentPage() {
  // Get the current domain to check if we have a parser
  const domain = window.location.hostname.replace("www.", "")

  // Request known parsers from background script
  return new Promise((resolve) => {
    browser.runtime.sendMessage({ action: "getKnownParsers" }, (response) => {
      const knownParsers = response.knownParsers

      // Check if we have a parser for this domain
      let parser = null
      for (const [parserDomain, selectors] of Object.entries(knownParsers)) {
        if (domain.includes(parserDomain)) {
          parser = selectors
          break
        }
      }

      // If we have a parser, use it to scrape the page
      if (parser) {
        const data = {
          hasKnownParser: true,
          url: window.location.href,
          title: document.title,
          productTitle: getTextContent(parser.productTitle),
          price: extractPrice(getTextContent(parser.price)),
          shippingPrice: extractPrice(getTextContent(parser.shippingPrice)),
          seller: getTextContent(parser.seller),
          timestamp: new Date().toISOString(),
        }
        resolve(data)
      } else {
        // No parser, return basic page info
        const data = {
          hasKnownParser: false,
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
        }
        resolve(data)
      }
    })
  })
}

// Helper function to get text content from a selector
function getTextContent(selector) {
  try {
    const element = document.querySelector(selector)
    return element ? element.textContent.trim() : ""
  } catch (e) {
    return ""
  }
}

// Helper function to extract price from text
function extractPrice(text) {
  if (!text) return null

  // Try to extract price with currency symbol
  const priceMatch = text.match(/[$€£¥]?\s?[0-9]+(?:[.,][0-9]+)?/)
  if (priceMatch) {
    // Remove currency symbol and spaces
    return priceMatch[0].replace(/[$€£¥\s]/g, "")
  }

  return null
}
