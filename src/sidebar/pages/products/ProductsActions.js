import { Store } from '../../state.js'
import { SidebarAPI } from '../../api.js'

export function navigateToSessions() {
  Store.setState({ currentView: 'sessions' })
}

export function navigateToOffers(productId) {
  Store.setState({
    currentProduct: productId,
    currentView: 'offers'
  })
}

export function navigateToDeliveryRules() {
  Store.setState({ currentView: 'deliveryRules' })
}

export function navigateToAlternatives() {
  Store.setState({ currentView: 'alternatives' })
}

export function navigateToImportFees() {
  Store.setState({ currentView: 'importFees' })
}

export function navigateToForwarders() {
  Store.setState({ currentView: 'forwarders', currentForwarderEditing: null })
}

export function getSession() {
  return Store.state.sessions.find(s => s.id === Store.state.currentSession)
}

export function createProduct(sessionId, productData) {
  return Store.sync(SidebarAPI.createProduct(sessionId, productData))
}

export function updateProduct(sessionId, productId, productData) {
  return Store.sync(SidebarAPI.updateProduct(sessionId, productId, productData))
}

export function updateSession(sessionId, sessionData) {
  return Store.sync(SidebarAPI.updateSession(sessionId, sessionData))
}

export function deleteProduct(sessionId, productId) {
  return Store.sync(SidebarAPI.deleteProduct(sessionId, productId))
}

export function optimizeSession(sessionData) {
  return SidebarAPI.optimizeSession(sessionData)
}

export function showOptimizationResults(result) {
  return SidebarAPI.showOptimizationResults(result)
}
