import { renderOfferFormView } from './OfferFormView.js'
import { collectOfferFormData, setupBundleToggle, setupProductSelection, shouldSaveAsBundle, getSelectedProductId } from './offerFormHelpers.js'
import * as actions from '../OffersActions.js'
import { t } from '../../../../shared/i18n.js'
import { Store } from '../../../state.js'
import { createModal, StorageService } from '../../../utils/index.js'
import { clearAllErrors, validateRequiredField, showFieldError } from '../../../modals.js'

/**
 * Shows a modal to edit an existing Page or Bundle.
 * Handles automatic conversion between Page and Bundle based on product selection.
 *
 * @param {Object} offer - Existing page or bundle to edit
 * @param {Object} session - Session containing products and settings
 * @param {Object|null} product - Current product (for pages)
 */
export async function showEditOfferModal(offer, session, product = null) {
  const isOriginallyBundle = offer.products && offer.products.length > 0

  const { modal } = createModal(
    renderOfferFormView({ offer, session, product }),
    {
      onSave: () => saveOffer(modal, offer, session, product, isOriginallyBundle)
    }
  )

  // Setup toggle and product selection
  setupBundleToggle(modal)
  setupProductSelection(modal)

  // Initialize default units if not set
  await initializeDefaults(offer)
}

async function initializeDefaults(offer) {
  const defaults = await StorageService.getDefaults()

  if (!offer.weightUnit) {
    const el = document.getElementById("page-weight-unit")
    if (el) el.value = defaults.weightUnit
  }
  if (!offer.volumeUnit) {
    const el = document.getElementById("page-volume-unit")
    if (el) el.value = defaults.volumeUnit
  }
  if (!offer.dimensionUnit) {
    const el = document.getElementById("page-dimension-unit")
    if (el) el.value = defaults.dimensionUnit
  }
  if (!offer.distanceUnit) {
    const el = document.getElementById("page-distance-unit")
    if (el) el.value = defaults.distanceUnit
  }
}

async function saveOffer(modal, offer, session, product, isOriginallyBundle) {
  clearAllErrors(modal)

  // Validate form
  if (!validateForm(session)) {
    return false
  }

  // Collect form data
  const formData = collectOfferFormData(session)
  const shouldBeBundle = shouldSaveAsBundle()

  // Build the data object for save
  const saveData = buildSaveData(formData, session)

  const sessionId = Store.state.currentSession

  if (shouldBeBundle) {
    // Should be a bundle (2+ products)
    saveData.products = formData.products

    if (isOriginallyBundle) {
      // Was bundle, stays bundle → update
      await actions.updateBundle(sessionId, offer.id, saveData)
    } else {
      // Was page, becomes bundle → delete page, create bundle
      await actions.deletePage(sessionId, product.id, offer.id)
      await actions.createBundle(sessionId, saveData)
    }
  } else {
    // Should be a page (1 product)
    const targetProductId = getSelectedProductId() || product?.id || Store.state.currentProduct

    if (isOriginallyBundle) {
      // Was bundle, becomes page → delete bundle, create page
      await actions.deleteBundle(sessionId, offer.id)
      await actions.createPage(sessionId, targetProductId, saveData)
    } else {
      // Was page, stays page → update
      await actions.updatePage(sessionId, product?.id || Store.state.currentProduct, offer.id, saveData)
    }
  }

  return true
}

function validateForm(session) {
  let isValid = true

  if (!validateRequiredField('page-price', t("pages.price"))) isValid = false
  if (!validateRequiredField('page-shipping', t("modals.shippingPrice"))) isValid = false
  if (!validateRequiredField('page-insurance', t("modals.insurancePrice"))) isValid = false
  if (!validateRequiredField('page-seller', t("pages.seller"))) isValid = false

  if (session.manageQuantity !== false) {
    const itemsPerPurchaseValue = document.getElementById("items-per-purchase")?.value
    const itemsPerPurchase = itemsPerPurchaseValue ? parseInt(itemsPerPurchaseValue) : null
    const maxPerPurchaseValue = document.getElementById("max-per-purchase")?.value
    const maxPerPurchase = maxPerPurchaseValue ? parseInt(maxPerPurchaseValue) : null

    if (!itemsPerPurchaseValue) {
      showFieldError('items-per-purchase', t("modals.itemsPerPurchaseRequired"))
      isValid = false
    } else if (itemsPerPurchase < 1) {
      showFieldError('items-per-purchase', t("modals.minOne"))
      isValid = false
    }

    if (maxPerPurchase !== null && maxPerPurchase < 1) {
      showFieldError('max-per-purchase', t("modals.minOne"))
      isValid = false
    }
  }

  // Check product selection
  const checkedProducts = document.querySelectorAll(".bundle-product-checkbox:checked")
  if (checkedProducts.length === 0) {
    alert(t("modals.selectAtLeastOneProduct"))
    isValid = false
  }

  return isValid
}

function buildSaveData(formData, session) {
  const data = {
    price: formData.price,
    shippingPrice: formData.shippingPrice,
    insurancePrice: formData.insurancePrice,
    seller: formData.seller,
    currency: formData.priceCurrency,
  }

  if (formData.customsCategoryId) {
    data.customsCategoryId = formData.customsCategoryId
  }

  if (session.manageQuantity !== false) {
    data.itemsPerPurchase = formData.itemsPerPurchase
    if (formData.maxPerPurchase) {
      data.maxPerPurchase = formData.maxPerPurchase
    }
  }

  if (formData.weight) {
    data.weight = formData.weight
    data.weightUnit = formData.weightUnit
  }

  if (formData.volume) {
    data.volume = formData.volume
    data.volumeUnit = formData.volumeUnit
  }

  if (formData.length || formData.width || formData.height) {
    if (formData.length) data.length = formData.length
    if (formData.width) data.width = formData.width
    if (formData.height) data.height = formData.height
    data.dimensionUnit = formData.dimensionUnit
  }

  if (formData.distance) {
    data.distance = formData.distance
    data.distanceUnit = formData.distanceUnit
  }

  return data
}
