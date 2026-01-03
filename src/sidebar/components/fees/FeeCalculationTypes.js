// ============================================================================
// FEE CALCULATION TYPES AND PRESETS
// ============================================================================

/**
 * Fee calculation type configurations
 * Each type has metadata about its category and requirements
 */
export const FEE_CALCULATION_TYPES = {
    // Simple types (always available)
    free: { category: 'simple', requiresTiers: false },
    fixed: { category: 'simple', requiresTiers: false },
    percentage: { category: 'simple', requiresTiers: false },

    // Item-based (seller only)
    item: { category: 'item', requiresTiers: false, sellerOnly: true },

    // Tierable types (may require session features)
    quantity: { category: 'tierable', requiresTiers: true },
    distance: { category: 'tierable', requiresTiers: true, requires: ['manageDistance'] },
    weight: { category: 'tierable', requiresTiers: true, requires: ['manageWeight'] },
    volume: { category: 'tierable', requiresTiers: true, requires: ['manageVolume'] },

    // Order amount-based (always tiered)
    order_amount: { category: 'order_amount', requiresTiers: true, alwaysTiered: true },

    // Dimension-based
    dimension: { category: 'dimension', requiresTiers: true, requires: ['manageDimension'] },

    // Combined types
    weight_volume: { category: 'combined', requiresTiers: true, requires: ['manageWeight', 'manageVolume'] },
    weight_dimension: { category: 'combined', requiresTiers: true, requires: ['manageWeight', 'manageDimension'] },
}

/**
 * Preset configurations for different contexts
 */
export const FEE_CONFIG_PRESETS = {
    // Full configuration for seller shipping fees (includes 'item')
    sellerShipping: {
        availableTypes: ['item', 'free', 'fixed', 'percentage', 'quantity', 'distance', 'weight', 'volume', 'order_amount', 'dimension', 'weight_volume', 'weight_dimension'],
        includeItem: true,
    },

    // Full configuration for forwarder re-shipping fees (no 'item')
    forwarderReShipping: {
        availableTypes: ['free', 'fixed', 'percentage', 'quantity', 'weight', 'volume', 'dimension', 'weight_volume', 'weight_dimension'],
        includeItem: false,
    },

    // Simple configuration for reception/repackaging fees
    simpleOnly: {
        availableTypes: ['free', 'fixed', 'percentage'],
        includeItem: false,
    },

    // Reception fees with quantity support
    receptionWithQuantity: {
        availableTypes: ['free', 'fixed', 'percentage', 'quantity'],
        includeItem: false,
    },

    // Storage fees with dimension and volume support (no advanced settings)
    storageWithDimensionVolume: {
        availableTypes: ['free', 'fixed', 'percentage', 'dimension', 'volume'],
        includeItem: false,
        hideAdvancedSettings: true,
    },

    // Repackaging fees with quantity, weight, and volume (no advanced settings)
    repackagingWithAdvanced: {
        availableTypes: ['free', 'fixed', 'percentage', 'quantity', 'weight', 'volume'],
        includeItem: false,
        hideAdvancedSettings: true,
    },
}

/**
 * Get type configuration
 * @param {string} type - The fee calculation type
 * @returns {object} Type configuration object
 */
export function getTypeConfig(type) {
    return FEE_CALCULATION_TYPES[type] || null
}

/**
 * Filter available types based on configuration and session features
 * @param {string[]} availableTypes - List of type values to filter
 * @param {object|null} session - Session object with feature flags
 * @param {boolean} includeItem - Whether to include 'item' type
 * @returns {string[]} Filtered list of available type values
 */
export function filterAvailableTypes(availableTypes, session, includeItem = true) {
    return availableTypes.filter(typeValue => {
        const config = FEE_CALCULATION_TYPES[typeValue]
        if (!config) return false

        // Filter out 'item' if not included
        if (typeValue === 'item' && !includeItem) return false

        // Check session feature requirements
        if (config.requires && config.requires.length > 0) {
            if (!session) return false
            return config.requires.every(req => session[req])
        }

        return true
    })
}
