import { renderProductsView } from './ProductsView.js'
import * as actions from './ProductsActions.js'
import { showNewProductModal, showEditProductModal, showDeleteProductModal, showCurrencyConversionModal } from './modals/index.js'
import { Store } from '../../state.js'
import { t } from '../../../shared/i18n.js'
import { getForeignCurrencies } from '../../utils/currencyDetection.js'
import { convertSessionCurrency } from '../../utils/currencyConversion.js'
import { StorageService } from '../../utils/StorageService.js'

export function initProductsPage(app) {
  const session = actions.getSession()

  if (!session) {
    Store.setState({ currentView: 'sessions' })
    return
  }

  app.innerHTML = renderProductsView({ session })
  attachEventListeners(session)
}

function attachEventListeners(session) {
  document.getElementById("back-button")?.addEventListener("click", actions.navigateToSessions)

  document.getElementById("new-product-button")?.addEventListener("click", () => {
    showNewProductModal(session)
  })

  document.getElementById("edit-rules-button")?.addEventListener("click", actions.navigateToDeliveryRules)

  document.getElementById("manage-alternatives-button")?.addEventListener("click", actions.navigateToAlternatives)

  if (session.forwardersEnabled) {
    document.getElementById("forwarders-button")?.addEventListener("click", actions.navigateToForwarders)
  }

  if (session.importFeesEnabled) {
    document.getElementById("import-fees-button")?.addEventListener("click", actions.navigateToImportFees)
  }

  document.getElementById("optimize-button")?.addEventListener("click", async () => {
    const session = actions.getSession()

    if (!session) {
      alert(t("optimization.sessionNotFound") || "Session not found")
      return
    }

    try {
      // Get user's default currency
      const settings = await StorageService.getUserSettings()
      const targetCurrency = settings.currency

      // Detect foreign currencies
      const foreignCurrencies = getForeignCurrencies(session, targetCurrency)

      let sessionToOptimize = session

      // If foreign currencies exist, show conversion modal
      if (foreignCurrencies.length > 0) {
        const rates = await showCurrencyConversionModal(foreignCurrencies, targetCurrency)

        // User cancelled
        if (!rates) {
          return
        }

        // Convert session's currencies
        sessionToOptimize = convertSessionCurrency(session, rates, targetCurrency)
      }

      // Proceed with optimization using converted session
      const result = await actions.optimizeSession(sessionToOptimize)

      if (result.success) {
        actions.showOptimizationResults(result.result)
      } else {
        alert(`${t("optimization.failed")}: ${result.error}`)
      }
    } catch (error) {
      console.error("Optimization error:", error)
      alert(`${t("optimization.failed")}: ${error.message}`)
    }
  })

  // Product item clicks (navigate to pages)
  document.querySelectorAll(".product-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (!e.target.closest(".edit-button") && !e.target.closest(".delete-button")) {
        actions.navigateToPages(item.dataset.id)
      }
    })
  })

  // Edit buttons
  document.querySelectorAll(".edit-button").forEach(button => {
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      const product = session.products.find(p => p.id === button.dataset.id)
      showEditProductModal(product, session)
    })
  })

  // Delete buttons
  document.querySelectorAll(".delete-button").forEach(button => {
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      showDeleteProductModal(button.dataset.id)
    })
  })
}
