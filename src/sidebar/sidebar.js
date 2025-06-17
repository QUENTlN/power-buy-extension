// DOM Elements
const app = document.getElementById("app")

// Declare browser
const browser = window.browser || window.chrome

// State
let sessions = []
let currentSession = null
let currentView = "sessions" // 'sessions', 'products', 'settings'
let currentProduct = null
let scrapedData = null

// Initialize
function init() {
  // Load data from storage
  browser.runtime.sendMessage({ action: "getSessions" }).then((response) => {
    sessions = response.sessions
    currentSession = response.currentSession
    renderApp()
  })

  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "scrapedData") {
      scrapedData = message.data
      showScrapedDataModal()
    }
  })
}

// Render functions
function renderApp() {
  switch (currentView) {
    case "sessions":
      renderSessionsView()
      break
    case "products":
      renderProductsView()
      break
    case "settings":
      renderSettingsView()
      break
    default:
      renderSessionsView()
  }
}

function renderSessionsView() {
  app.innerHTML = `
    <div class="mx-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-3">
        <h1 class="text-2xl font-semibold text-gray-800">Sessions list</h1>
        <button class="text-gray-600 p-2 cursor-pointer" id="settings-button">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <!-- Session Cards -->
      <div class="space-y-4">
        ${sessions.map(session => `
          <div class="bg-white rounded-xl shadow-md p-4 session-item" data-id="${session.id}">
            <div class="flex justify-between items-center">
              <div class="flex-1 min-w-0 mr-4 cursor-pointer">
                <h2 class="text-xl font-medium text-gray-800 truncate">${session.name}</h2>
                <p class="text-gray-600 text-md truncate">${session.products.length} Products</p>
              </div>
              <div class="flex space-x-2 flex-shrink-0">
                <button class="text-gray-600 p-1 cursor-pointer edit-button" data-id="${session.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button class="text-gray-600 p-1 cursor-pointer delete-button" data-id="${session.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- New Session Button -->
      <button id="new-session-button" class="cursor-pointer mt-6 w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="text-lg font-medium">Create New Session</span>
      </button>
    </div>
  `

  // Add event listeners
  document.getElementById("settings-button").addEventListener("click", () => {
    currentView = "settings"
    renderApp()
  })

  document.getElementById("new-session-button").addEventListener("click", () => {
    showNewSessionModal()
  })

  document.querySelectorAll(".session-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.closest(".edit-button") && !e.target.closest(".delete-button")) {
        const sessionId = item.dataset.id
        currentSession = sessionId
        browser.runtime.sendMessage({
          action: "setCurrentSession",
          sessionId,
        })
        currentView = "products"
        renderApp()
      }
    })
  })

  document.querySelectorAll(".edit-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      const sessionId = button.dataset.id
      const session = sessions.find((s) => s.id === sessionId)
      showEditSessionModal(session)
    })
  })

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      const sessionId = button.dataset.id
      showDeleteSessionModal(sessionId)
    })
  })
}

function renderProductsView() {
  const session = sessions.find((s) => s.id === currentSession)
  if (!session) {
    currentView = "sessions"
    renderApp()
    return
  }

  app.innerHTML = `
    <div class="mx-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center space-x-3">
          <button class="text-gray-600 p-2 cursor-pointer" id="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl pl-4 font-semibold text-gray-800">${session.name}</h1>
        </div>
      </div>

      <!-- Product Cards -->
      <div class="space-y-4">
        ${session.products.map(product => `
          <div class="bg-white rounded-xl shadow-md p-4 product-item" data-id="${product.id}">
            <div class="flex justify-between items-center cursor-pointer">
              <div class="flex-1 min-w-0 mr-4 cursor-pointer">
                <h2 class="text-xl font-medium text-gray-800 truncate">${product.name}</h2>
                <p class="text-gray-600 text-md truncate">${product.pages.length} Pages</p>
              </div>
              <div class="flex space-x-2 flex-shrink-0">
                <button class="text-gray-600 p-1 cursor-pointer edit-button" data-id="${product.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button class="text-gray-600 p-1 cursor-pointer delete-button" data-id="${product.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Action Buttons -->
      <div class="flex space-x-4 mt-6">
        <button id="new-product-button" class="flex-1 flex items-center justify-center space-x-2 cursor-pointer bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="text-lg font-medium">New Product</span>
        </button>
        <button id="optimize-button" class="flex-1 flex items-center justify-center space-x-2 cursor-pointer bg-gray-800 text-white px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors duration-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="text-lg font-medium">Optimize</span>
        </button>
      </div>
    </div>
  `

  // Add event listeners
  document.getElementById("back-button").addEventListener("click", () => {
    currentView = "sessions"
    renderApp()
  })

  document.getElementById("new-product-button").addEventListener("click", () => {
    showNewProductModal()
  })

  document.getElementById("optimize-button").addEventListener("click", () => {
    showOptimizationModal()
  })

  document.querySelectorAll(".product-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.closest(".edit-button") && !e.target.closest(".delete-button")) {
        const productId = item.dataset.id
        const product = session.products.find((p) => p.id === productId)
        showProductDetailsModal(product)
      }
    })
  })

  document.querySelectorAll(".edit-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      const productId = button.dataset.id
      const product = session.products.find((p) => p.id === productId)
      showEditProductModal(product)
    })
  })

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      const productId = button.dataset.id
      showDeleteProductModal(productId)
    })
  })
}

function renderSettingsView() {
  // Get settings from storage
  browser.storage.local.get(["darkMode", "language", "currency", "displayMode"]).then((settings) => {
    app.innerHTML = `
      <div class="mx-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center space-x-3">
        <button class="text-gray-600 p-2 cursor-pointer" id="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-2xl pl-4 font-semibold text-gray-800">Settings</h1>
        </div>
      </div>

      <!-- Settings Form -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-md p-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <select id="language" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="en" ${settings.language === "en" ? "selected" : ""}>English</option>
          <option value="fr" ${settings.language === "fr" ? "selected" : ""}>Français</option>
          <option value="es" ${settings.language === "es" ? "selected" : ""}>Español</option>
        </select>
        </div>

        <div class="bg-white rounded-xl shadow-md p-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Default currency</label>
        <select id="currency" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="USD" ${settings.currency === "USD" ? "selected" : ""}>US Dollar - $</option>
          <option value="EUR" ${settings.currency === "EUR" ? "selected" : ""}>Euro - €</option>
          <option value="GBP" ${settings.currency === "GBP" ? "selected" : ""}>British Pound - £</option>
        </select>
        </div>

        <div class="bg-white rounded-xl shadow-md p-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Dark mode</label>
        <div class="flex items-center">
          <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="dark-mode" class="sr-only peer" ${settings.darkMode ? "checked" : ""}>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-4">
        <label class="block text-sm font-medium text-gray-700 mb-3">Display mode</label>
        <div class="space-y-2">
          <div class="flex items-center">
          <input type="radio" id="sidebar-mode" name="display-mode" value="sidebar" ${settings.displayMode === "sidebar" ? "checked" : ""} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
          <label for="sidebar-mode" class="ml-2 text-gray-700">Sidebar</label>
          </div>
          <div class="flex items-center">
          <input type="radio" id="popup-mode" name="display-mode" value="popup" ${settings.displayMode === "popup" ? "checked" : ""} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
          <label for="popup-mode" class="ml-2 text-gray-700">Pop-up</label>
          </div>
        </div>
        </div>
      </div>

      <!-- Save Button -->
      <button id="save-settings-button" class="w-full mt-6 flex items-center justify-center space-x-2 cursor-pointer bg-gray-800 text-white px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors duration-200 shadow-sm">
        <span class="text-lg font-medium">Save Settings</span>
      </button>
      </div>
    `

    // Add event listeners
    document.getElementById("back-button").addEventListener("click", () => {
      currentView = "sessions"
      renderApp()
    })

    document.getElementById("save-settings-button").addEventListener("click", () => {
      const darkMode = document.getElementById("dark-mode").checked
      const language = document.getElementById("language").value
      const currency = document.getElementById("currency").value
      const displayMode = document.querySelector('input[name="display-mode"]:checked').value

      browser.storage.local
        .set({
          darkMode,
          language,
          currency,
          displayMode,
        })
        .then(() => {
          // Apply settings
          if (darkMode) {
            document.body.classList.add("dark-mode")
          } else {
            document.body.classList.remove("dark-mode")
          }

          currentView = "sessions"
          renderApp()
        })
    })
  })
}
// Modal functions
function showNewSessionModal() {
  const modal = document.createElement("div")
  modal.innerHTML = `
    <div id="modalOverlay" class="fixed w-full h-full inset-0 bg-black/50 flex justify-center items-center z-50">
      <div id="modalContent" class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">New Session</h3>
        <input 
          type="text" 
          id="session-name" 
          placeholder="Enter session name" 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
        
        <div class="flex justify-end space-x-4">
          <button id="cancel-button" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer rounded">Cancel</button>
          <button id="save-button" class="px-4 py-2 bg-gray-800 text-white font-medium cursor-pointer rounded flex items-center">
            Save
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.querySelector("#modalOverlay").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.querySelector("#modalContent").addEventListener("click", (event) => {
    event.stopPropagation()
  })

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("save-button").addEventListener("click", () => {
    const name = document.getElementById("session-name").value.trim()
    if (name) {
      browser.runtime
        .sendMessage({
          action: "createSession",
          name,
        })
        .then((response) => {
          sessions = response.sessions
          currentSession = response.currentSession
          document.body.removeChild(modal)
          renderApp()
        })
    }
  })
}

function showEditSessionModal(session) {
  const modal = document.createElement("div") 
  modal.innerHTML = `
    <div id="modalOverlay" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div id="modalContent" class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6" onclick="event.stopPropagation()">
        <h3 class="text-lg font-medium text-gray-800 mb-4">Edit Session</h3>
        <input 
          type="text" 
          id="session-name" 
          value="${session.name}"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
        
        <div class="flex justify-end space-x-4">
          <button id="cancel-button" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer rounded">Cancel</button>
          <button id="save-button" class="px-4 py-2 bg-gray-800 text-white font-medium cursor-pointer rounded flex items-center">
            Save
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.querySelector("#modalOverlay").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.querySelector("#modalContent").addEventListener("click", (event) => {
    event.stopPropagation()
  })

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("save-button").addEventListener("click", () => {
    const name = document.getElementById("session-name").value.trim()
    if (name) {
      session.name = name
      browser.runtime
        .sendMessage({
          action: "updateSession",
          session,
        })
        .then((response) => {
          sessions = response.sessions
          document.body.removeChild(modal)
          renderApp()
        })
    }
  })
}

function showDeleteSessionModal(sessionId) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div id="modalOverlay" class="fixed w-full h-full inset-0 bg-black/50 flex justify-center items-center z-50">
      <div id="modalContent" class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">Are you sure you want to delete?</h3>
        
        <div class="flex justify-end space-x-4">
          <button id="cancel-button" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer rounded">Cancel</button>
          <button id="delete-button" class="px-4 py-2 bg-gray-800 text-white font-medium cursor-pointer rounded flex items-center">
            Delete
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.querySelector("#modalOverlay").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.querySelector("#modalContent").addEventListener("click", (event) => {
    event.stopPropagation()
  })

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("delete-button").addEventListener("click", () => {
    browser.runtime
      .sendMessage({
        action: "deleteSession",
        sessionId,
      })
      .then((response) => {
        sessions = response.sessions
        currentSession = response.currentSession
        document.body.removeChild(modal)
        renderApp()
      })
  })
}

function showNewProductModal() {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div id="modalOverlay" class="fixed w-full h-full inset-0 bg-black/50 flex justify-center items-center z-50">
      <div id="modalContent" class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">New Product</h3>
        
        <div class="mb-6">
          <label for="product-name" class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input 
            type="text" 
            id="product-name" 
            placeholder="Enter product name"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Has alternatives</label>
          <div class="flex items-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="has-alternatives" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-500">If the product can be replaced by another, select which ones.</p>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Limited Compatibility</label>
          <div class="flex items-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="limited-compatibility" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-500">If this product is not compatible with all the others, you will need to select which ones.</p>
        </div>
        
        <div class="flex justify-end space-x-4">
          <button id="cancel-button" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer rounded">Cancel</button>
          <button id="save-button" class="px-4 py-2 bg-gray-800 text-white font-medium cursor-pointer rounded flex items-center">
            Save
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("save-button").addEventListener("click", () => {
    const name = document.getElementById("product-name").value.trim()
    const hasAlternatives = document.getElementById("has-alternatives").checked
    const limitedCompatibility = document.getElementById("limited-compatibility").checked

    if (name) {
      browser.runtime
        .sendMessage({
          action: "createProduct",
          sessionId: currentSession,
          product: {
            name,
            hasAlternatives,
            limitedCompatibility,
          },
        })
        .then((response) => {
          sessions = response.sessions
          document.body.removeChild(modal)
          renderApp()
        })
    }
  })
}

function showEditProductModal(product) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div id="modalOverlay" class="fixed w-full h-full inset-0 bg-black/50 flex justify-center items-center z-50">
      <div id="modalContent" class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">Edit Product</h3>
        
        <div class="mb-6">
          <label for="product-name" class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input 
            type="text" 
            id="product-name" 
            value="${product.name}"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Has alternatives</label>
          <div class="flex items-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="has-alternatives" class="sr-only peer" ${product.hasAlternatives ? "checked" : ""}>
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-500">If the product can be replaced by another, select which ones.</p>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Limited Compatibility</label>
          <div class="flex items-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="limited-compatibility" class="sr-only peer" ${product.limitedCompatibility ? "checked" : ""}>
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-500">If this product is not compatible with all the others, you will need to select which ones.</p>
        </div>
        
        <div class="flex justify-end space-x-4">
          <button id="cancel-button" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer rounded">Cancel</button>
          <button id="save-button" class="px-4 py-2 bg-gray-800 text-white font-medium cursor-pointer rounded flex items-center">
            Save
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("save-button").addEventListener("click", () => {
    const name = document.getElementById("product-name").value.trim()
    const hasAlternatives = document.getElementById("has-alternatives").checked
    const limitedCompatibility = document.getElementById("limited-compatibility").checked

    if (name) {
      product.name = name
      product.hasAlternatives = hasAlternatives
      product.limitedCompatibility = limitedCompatibility

      browser.runtime
        .sendMessage({
          action: "updateProduct",
          sessionId: currentSession,
          product,
        })
        .then((response) => {
          sessions = response.sessions
          document.body.removeChild(modal)
          renderApp()
        })
    }
  })
}

function showDeleteProductModal(productId) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Delete Product</h2>
      </div>
      <p>Are you sure you want to delete?</p>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-button">Cancel</button>
        <button class="btn btn-danger" id="delete-button">Delete</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("delete-button").addEventListener("click", () => {
    browser.runtime
      .sendMessage({
        action: "deleteProduct",
        sessionId: currentSession,
        productId,
      })
      .then((response) => {
        sessions = response.sessions
        document.body.removeChild(modal)
        renderApp()
      })
  })
}

function showProductDetailsModal(product) {
  const session = sessions.find((s) => s.id === currentSession)

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div id="modalOverlay" class="fixed w-full h-full inset-0 bg-black/50 flex justify-center items-center z-50">
      <div id="modalContent" class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-gray-800">${product.name}</h2>
        </div>

        <!-- Pages List -->
        <div class="space-y-4 mb-6">
          <label class="block text-sm font-medium text-gray-700">Pages</label>
          ${product.pages.length > 0 
            ? product.pages.map(page => `
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0 mr-4">
                    <p class="text-sm text-gray-900 truncate">${page.url.substring(0, 30)}...</p>
                    <p class="text-sm text-gray-600">Price: ${page.price || "N/A"}</p>
                    <p class="text-sm text-gray-600">Shipping: ${page.shippingPrice || "N/A"}</p>
                    <p class="text-sm text-gray-600">Seller: ${page.seller || "N/A"}</p>
                  </div>
                  <button class="text-gray-600 p-1 cursor-pointer delete-page-button" data-id="${page.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')
            : '<div class="text-gray-500 text-center py-4">No pages added yet</div>'
          }
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button id="close-button" class="flex-1 flex items-center justify-center space-x-2 cursor-pointer bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
            <span class="text-lg font-medium">Close</span>
          </button>
          <button id="add-page-button" class="flex-1 flex items-center justify-center space-x-2 cursor-pointer bg-gray-800 text-white px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors duration-200 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="text-lg font-medium">Add Page</span>
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  document.querySelector("#modalOverlay").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.querySelector("#modalContent").addEventListener("click", (event) => {
    event.stopPropagation()
  })

  document.getElementById("close-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("add-page-button").addEventListener("click", () => {
    currentProduct = product.id
    document.body.removeChild(modal)

    // Request scraping of the current page
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.runtime.sendMessage({
        action: "scrapePage",
        tabId: tabs[0].id,
      })
    })
  })

  document.querySelectorAll(".delete-page-button").forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.id
      browser.runtime
        .sendMessage({
          action: "deletePage",
          sessionId: currentSession,
          productId: product.id,
          pageId,
        })
        .then((response) => {
          sessions = response.sessions
          document.body.removeChild(modal)
          showProductDetailsModal(
            sessions.find((s) => s.id === currentSession).products.find((p) => p.id === product.id),
          )
        })
    })
  })
}

function showScrapedDataModal() {
  if (!scrapedData) return

  const session = sessions.find((s) => s.id === currentSession)
  const product = session.products.find((p) => p.id === currentProduct)

  const modal = document.createElement("div")
  modal.className = "modal"

  if (scrapedData.hasKnownParser) {
    // Known parser, show scraped data
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Add Page for ${product.name}</h2>
        </div>
        <div class="form-group">
          <label>Is this a bundle?</label>
          <div class="toggle-container">
            <label class="toggle-switch">
              <input type="checkbox" id="is-bundle">
              <span class="slider"></span>
            </label>
          </div>
          <small>A bundle contains multiple products with a single price and shipping cost.</small>
        </div>
        <div id="product-selection" class="form-group" style="display: none;">
          <label>Select products in this bundle:</label>
          <div class="product-selection-list">
            ${session.products
              .map(
                (p) => `
              <div class="checkbox-group">
                <input type="checkbox" id="product-${p.id}" value="${p.id}" ${p.id === product.id ? "checked disabled" : ""}>
                <label for="product-${p.id}">${p.name}</label>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        <div class="form-group">
          <label for="page-url">URL</label>
          <input type="text" id="page-url" class="form-control" value="${scrapedData.url}" readonly>
        </div>
        <div class="form-group">
          <label for="page-price">Price</label>
          <input type="text" id="page-price" class="form-control" value="${scrapedData.price || ""}">
        </div>
        <div class="form-group">
          <label for="page-shipping">Shipping Price</label>
          <input type="text" id="page-shipping" class="form-control" value="${scrapedData.shippingPrice || ""}">
        </div>
        <div class="form-group">
          <label for="page-seller">Seller</label>
          <input type="text" id="page-seller" class="form-control" value="${scrapedData.seller || ""}">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-button">Cancel</button>
          <button class="btn btn-primary" id="save-button">Save</button>
        </div>
      </div>
    `
  } else {
    // Unknown parser, manual entry
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Add Page for ${product.name}</h2>
        </div>
        <p>This website doesn't have a known parser. Please enter the details manually.</p>
        <div class="form-group">
          <label>Is this a bundle?</label>
          <div class="toggle-container">
            <label class="toggle-switch">
              <input type="checkbox" id="is-bundle">
              <span class="slider"></span>
            </label>
          </div>
          <small>A bundle contains multiple products with a single price and shipping cost.</small>
        </div>
        <div id="product-selection" class="form-group" style="display: none;">
          <label>Select products in this bundle:</label>
          <div class="product-selection-list">
            ${session.products
              .map(
                (p) => `
              <div class="checkbox-group">
                <input type="checkbox" id="product-${p.id}" value="${p.id}" ${p.id === product.id ? "checked disabled" : ""}>
                <label for="product-${p.id}">${p.name}</label>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        <div class="form-group">
          <label for="page-url">URL</label>
          <input type="text" id="page-url" class="form-control" value="${scrapedData.url}" readonly>
        </div>
        <div class="form-group">
          <label for="page-price">Price</label>
          <input type="text" id="page-price" class="form-control" placeholder="Enter price">
        </div>
        <div class="form-group">
          <label for="page-shipping">Shipping Price</label>
          <input type="text" id="page-shipping" class="form-control" placeholder="Enter shipping price">
        </div>
        <div class="form-group">
          <label for="page-seller">Seller</label>
          <input type="text" id="page-seller" class="form-control" placeholder="Enter seller name">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-button">Cancel</button>
          <button class="btn btn-primary" id="save-button">Save</button>
        </div>
      </div>
    `
  }

  document.body.appendChild(modal)

  // Toggle bundle product selection
  document.getElementById("is-bundle").addEventListener("change", (e) => {
    const productSelection = document.getElementById("product-selection")
    if (e.target.checked) {
      productSelection.style.display = "block"
    } else {
      productSelection.style.display = "none"
    }
  })

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
    scrapedData = null
  })

  document.getElementById("save-button").addEventListener("click", () => {
    const isBundle = document.getElementById("is-bundle").checked
    const url = document.getElementById("page-url").value
    const price = document.getElementById("page-price").value
    const shippingPrice = document.getElementById("page-shipping").value
    const seller = document.getElementById("page-seller").value

    const bundledProducts = []
    if (isBundle) {
      document.querySelectorAll('#product-selection input[type="checkbox"]:checked').forEach((checkbox) => {
        bundledProducts.push(checkbox.value)
      })
    }

    const page = {
      url,
      price,
      shippingPrice,
      seller,
      isBundle,
      bundledProducts,
      timestamp: new Date().toISOString(),
    }

    browser.runtime
      .sendMessage({
        action: "addPage",
        sessionId: currentSession,
        productId: currentProduct,
        page,
      })
      .then((response) => {
        sessions = response.sessions
        document.body.removeChild(modal)
        scrapedData = null

        // Show product details again
        const updatedProduct = sessions
          .find((s) => s.id === currentSession)
          .products.find((p) => p.id === currentProduct)
        showProductDetailsModal(updatedProduct)
      })
  })
}

function showOptimizationModal() {
  const session = sessions.find((s) => s.id === currentSession)

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Optimize Shopping</h2>
      </div>
      <p>Configure delivery settings for each seller before optimizing.</p>
      <div class="seller-settings">
        ${getUniqueSellers(session)
          .map(
            (seller) => `
          <div class="seller-setting">
            <h3>${seller}</h3>
            <div class="form-group">
              <label>Delivery Type</label>
              <select class="form-control delivery-type" data-seller="${seller}">
                <option value="fixed">Fixed Price</option>
                <option value="free-threshold">Free Above Threshold</option>
                <option value="first-item">First Item Full Price, Discounted Additional</option>
              </select>
            </div>
            <div class="delivery-options" id="delivery-options-${seller.replace(/\s+/g, "-")}">
              <div class="form-group fixed-price">
                <label>Fixed Delivery Price</label>
                <input type="number" class="form-control fixed-price-value" data-seller="${seller}" step="0.01" min="0">
              </div>
              <div class="form-group free-threshold" style="display: none;">
                <label>Free Delivery Threshold</label>
                <input type="number" class="form-control free-threshold-value" data-seller="${seller}" step="0.01" min="0">
              </div>
              <div class="form-group first-item" style="display: none;">
                <label>First Item Price</label>
                <input type="number" class="form-control first-item-price" data-seller="${seller}" step="0.01" min="0">
              </div>
              <div class="form-group first-item" style="display: none;">
                <label>Additional Items Price</label>
                <input type="number" class="form-control additional-items-price" data-seller="${seller}" step="0.01" min="0">
              </div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-button">Cancel</button>
        <button class="btn btn-primary" id="optimize-button">Optimize</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Add event listeners for delivery type changes
  document.querySelectorAll(".delivery-type").forEach((select) => {
    select.addEventListener("change", (e) => {
      const seller = e.target.dataset.seller
      const optionsContainer = document.getElementById(`delivery-options-${seller.replace(/\s+/g, "-")}`)

      // Hide all options first
      optionsContainer.querySelectorAll(".fixed-price, .free-threshold, .first-item").forEach((el) => {
        el.style.display = "none"
      })

      // Show selected option
      const selectedType = e.target.value
      if (selectedType === "fixed") {
        optionsContainer.querySelectorAll(".fixed-price").forEach((el) => {
          el.style.display = "block"
        })
      } else if (selectedType === "free-threshold") {
        optionsContainer.querySelectorAll(".free-threshold").forEach((el) => {
          el.style.display = "block"
        })
      } else if (selectedType === "first-item") {
        optionsContainer.querySelectorAll(".first-item").forEach((el) => {
          el.style.display = "block"
        })
      }
    })
  })

  document.getElementById("cancel-button").addEventListener("click", () => {
    document.body.removeChild(modal)
  })

  document.getElementById("optimize-button").addEventListener("click", () => {
    // Collect delivery rules
    const deliveryRules = []

    getUniqueSellers(session).forEach((seller) => {
      const typeSelect = document.querySelector(`.delivery-type[data-seller="${seller}"]`)
      const type = typeSelect.value

      const rule = {
        seller,
        type,
      }

      if (type === "fixed") {
        const priceInput = document.querySelector(`.fixed-price-value[data-seller="${seller}"]`)
        rule.fixedPrice = Number.parseFloat(priceInput.value) || 0
      } else if (type === "free-threshold") {
        const thresholdInput = document.querySelector(`.free-threshold-value[data-seller="${seller}"]`)
        rule.threshold = Number.parseFloat(thresholdInput.value) || 0
      } else if (type === "first-item") {
        const firstItemInput = document.querySelector(`.first-item-price[data-seller="${seller}"]`)
        const additionalItemsInput = document.querySelector(`.additional-items-price[data-seller="${seller}"]`)
        rule.firstItemPrice = Number.parseFloat(firstItemInput.value) || 0
        rule.additionalItemsPrice = Number.parseFloat(additionalItemsInput.value) || 0
      }

      deliveryRules.push(rule)
    })

    // Save delivery rules to session
    session.deliveryRules = deliveryRules

    browser.runtime
      .sendMessage({
        action: "updateSession",
        session,
      })
      .then(() => {
        // Start optimization
        browser.runtime
          .sendMessage({
            action: "optimizeSession",
            sessionId: currentSession,
          })
          .then((result) => {
            document.body.removeChild(modal)

            if (result.success) {
              // Open results page
              browser.runtime.sendMessage({
                action: "showOptimizationResults",
                result: result.result,
              })
            } else {
              alert(`Optimization failed: ${result.error}`)
            }
          })
      })
  })
}

// Helper functions
function getUniqueSellers(session) {
  const sellers = new Set()

  session.products.forEach((product) => {
    product.pages.forEach((page) => {
      if (page.seller) {
        sellers.add(page.seller)
      }
    })
  })

  return Array.from(sellers)
}

// Initialize the app
document.addEventListener("DOMContentLoaded", init)
