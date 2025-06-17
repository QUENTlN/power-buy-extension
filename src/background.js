// Store for sessions, products, and pages
let sessions = []
let currentSession = null
let knownParsers = {
  "amazon.com": {
    productTitle: ".product-title-word-break",
    price: ".a-price .a-offscreen",
    shippingPrice: "#deliveryBlockMessage",
    seller: ".tabular-buybox-text",
  },
  "ebay.com": {
    productTitle: ".x-item-title__mainTitle",
    price: ".x-price-primary",
    shippingPrice: ".x-deliveryMessage",
    seller: ".x-sellerCard-name",
  },
  // Add more known parsers here
}

// Initialize from storage
var browser = browser || chrome // Declare browser before using it

browser.storage.local.get(["sessions", "currentSession", "knownParsers"]).then((result) => {
  if (result.sessions) sessions = result.sessions
  if (result.currentSession) currentSession = result.currentSession
  if (result.knownParsers) knownParsers = result.knownParsers
})

// Save to storage
function saveToStorage() {
  browser.storage.local.set({
    sessions,
    currentSession,
    knownParsers,
  })
}

// Message handlers
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "createSession":
      createSession(message.name)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "updateSession":
      updateSession(message.sessionId, message.updatedSession)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "deleteSession":
      deleteSession(message.sessionId)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "setCurrentSession":
      setCurrentSession(message.sessionId)
      sendResponse({ success: true, currentSession })
      break
    case "createProduct":
      createProduct(message.sessionId, message.product)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "deleteProduct":
      deleteProduct(message.sessionId, message.productId)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "addPage":
      addPage(message.sessionId, message.productId, message.page)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "deletePage":
      deletePage(message.sessionId, message.productId, message.pageId)
      sendResponse({ success: true, sessions, currentSession })
      break
    case "getSessions":
      sendResponse({ sessions, currentSession })
      break
    case "getCurrentSession":
      sendResponse({ currentSession })
      break
    case "getKnownParsers":
      sendResponse({ knownParsers })
      break
    case "scrapePage":
      scrapePage(sender.tab.id)
      break
    case "optimizeSession":
      optimizeSession(message.sessionId).then((result) => sendResponse(result))
      return true // For async response
  }
})

// Session management
function createSession(name) {
  const newSession = {
    id: Date.now().toString(),
    name,
    products: [],
    created: new Date().toISOString(),
  }
  sessions.push(newSession)
  currentSession = newSession.id
  saveToStorage()
}

function updateSession(sessionId, updatedSession) {
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId)
  if (sessionIndex !== -1) {
    sessions[sessionIndex] = { ...sessions[sessionIndex], ...updatedSession }
    saveToStorage()
  }
}

function deleteSession(sessionId) {
  sessions = sessions.filter((session) => session.id !== sessionId)
  if (currentSession === sessionId) {
    currentSession = sessions.length > 0 ? sessions[0].id : null
  }
  saveToStorage()
}

function setCurrentSession(sessionId) {
  currentSession = sessionId
  saveToStorage()
}

// Product management
function createProduct(sessionId, product) {
  const session = sessions.find((s) => s.id === sessionId)
  if (session) {
    product.id = Date.now().toString()
    product.pages = []
    session.products.push(product)
    saveToStorage()
  }
}

function deleteProduct(sessionId, productId) {
  const session = sessions.find((s) => s.id === sessionId)
  if (session) {
    session.products = session.products.filter((p) => p.id !== productId)
    saveToStorage()
  }
}

// Page management
function addPage(sessionId, productId, page) {
  const session = sessions.find((s) => s.id === sessionId)
  if (session) {
    const product = session.products.find((p) => p.id === productId)
    if (product) {
      page.id = Date.now().toString()
      product.pages.push(page)
      saveToStorage()
    }
  }
}

function deletePage(sessionId, productId, pageId) {
  const session = sessions.find((s) => s.id === sessionId)
  if (session) {
    const product = session.products.find((p) => p.id === productId)
    if (product) {
      product.pages = product.pages.filter((p) => p.id !== pageId)
      saveToStorage()
    }
  }
}

// Scraping
function scrapePage(tabId) {
  browser.tabs.sendMessage(tabId, { action: "scrape" })
}

// Optimization
async function optimizeSession(sessionId) {
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return { success: false, error: "Session not found" }

  try {
    // Prepare data for the backend
    const data = {
      products: session.products.map((product) => ({
        id: product.id,
        name: product.name,
        pages: product.pages.map((page) => ({
          url: page.url,
          price: page.price,
          shippingPrice: page.shippingPrice,
          seller: page.seller,
          isBundle: page.isBundle,
          bundledProducts: page.bundledProducts || [],
        })),
      })),
      deliveryRules: session.deliveryRules || [],
    }

    // Call backend API
    const response = await fetch("https://your-backend-api.com/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Open optimization results in a new tab
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "showOptimizationResults") {
    browser.tabs.create({
      url: "results/results.html",
    })
  }
})
