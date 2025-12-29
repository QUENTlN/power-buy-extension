import { t } from '../../../shared/i18n.js'
import { WEIGHT_UNITS, VOLUME_UNITS, DIMENSION_UNITS, DISTANCE_UNITS, DEFAULT_WEIGHT_UNIT, DEFAULT_VOLUME_UNIT, DEFAULT_DIMENSION_UNIT, DEFAULT_DISTANCE_UNIT } from '../../../shared/config/units.js'
import { CURRENCIES, DEFAULT_CURRENCY } from '../../../shared/config/currencies.js'
import { Store } from '../../state.js'
import { formatPercent, getCurrencySymbol } from '../../utils/formatters.js'
import { getUniqueSellers } from '../../utils/sellers.js'

// ============================================================================
// UNIT HELPERS
// ============================================================================

export function getUnitOptions(type) {
    if (type === 'weight') return WEIGHT_UNITS
    if (type === 'volume') return VOLUME_UNITS
    if (type === 'distance') return DISTANCE_UNITS
    if (type === 'dimension') return DIMENSION_UNITS
    return []
}

export function getUnitLabel(type, unitValue) {
    const units = getUnitOptions(type)
    const unit = units.find(u => u.value === unitValue)
    return unit ? unit.label : unitValue
}

export function getValueLabel(type, tierValueType, tierValueMode, unit = '') {
    const isPerUnit = tierValueMode === 'perUnit'

    let prefix = ''
    if (tierValueType === 'fixed') {
        prefix = Store.state.currency
    } else if (tierValueType === 'pctOrder') {
        prefix = '%commande'
    } else if (tierValueType === 'pctDelivery') {
        prefix = '%livraison'
    }

    if (!isPerUnit) {
        return prefix
    }

    let unitLabel = ''
    if (type === 'quantity') {
        unitLabel = `/${t('shippingFees.item')}`
    } else if (type === 'distance') {
        const unitVal = unit || DEFAULT_DISTANCE_UNIT
        unitLabel = `/${getUnitLabel('distance', unitVal)}`
    } else if (type === 'weight') {
        const unitVal = unit || DEFAULT_WEIGHT_UNIT
        unitLabel = `/${getUnitLabel('weight', unitVal)}`
    } else if (type === 'volume') {
        const unitVal = unit || DEFAULT_VOLUME_UNIT
        unitLabel = `/${getUnitLabel('volume', unitVal)}`
    } else if (type === 'dimension') {
        unitLabel = ''
    } else if (type === 'weight_dimension') {
        unitLabel = ''
    } else if (type === 'weight_volume') {
        unitLabel = ''
    }

    return prefix + unitLabel
}

export function getHelpTextForMode(type, tierValueMode) {
    if (tierValueMode === 'perUnit') {
        if (type === 'quantity') {
            return t('deliveryRules.tierValueModeQuantityPerUnitHelp')
        } else if (type === 'distance') {
            return t('deliveryRules.tierValueModeDistancePerUnitHelp')
        } else if (type === 'weight') {
            return t('deliveryRules.tierValueModeWeightPerUnitHelp')
        } else if (type === 'volume') {
            return t('deliveryRules.tierValueModeVolumePerUnitHelp')
        }
        return t('deliveryRules.tierValueModePerUnitHelp')
    } else {
        return t('deliveryRules.tierValueModeTotalHelp')
    }
}

// ============================================================================
// HTML COMPONENT HELPERS
// ============================================================================

export function renderRadioOption(config) {
    const { name, value, checked, label, helpText, helpIcon = true, additionalClasses = '' } = config
    const radioId = `${name}_${value}`

    return `
        <div class="relative ${additionalClasses}">
            <label for="${radioId}" class="flex items-center p-4 border border-default rounded-xl cursor-pointer hover:bg-[hsl(var(--muted))] transition-all bg-[hsl(var(--card))] has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--muted))]/50 has-[:checked]:ring-1 has-[:checked]:ring-[hsl(var(--primary))]/20">
                <input type="radio" id="${radioId}" name="${name}" value="${value}" class="sr-only peer" ${checked ? 'checked' : ''}>
                <div class="w-5 h-5 rounded-full border border-default flex items-center justify-center mr-3 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                    <div class="w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                </div>
                <span class="card-text font-medium text-sm transition-colors peer-checked:text-primary flex-1 truncate">${label}</span>
                ${helpIcon && helpText ? `<div class="icon icon-help w-4 h-4 secondary-text opacity-40 hover:opacity-100 transition-opacity cursor-help" title="${helpText}"></div>` : ''}
            </label>
        </div>
    `
}

export function renderToggleSwitch(config) {
    const { id, label, checked, containerClass = '', additionalAttrs = '' } = config

    return `
        <div class="${containerClass}">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium card-text">${label}</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="${id}" class="sr-only peer" ${checked ? 'checked' : ''} ${additionalAttrs}>
                    <div class="toggle-switch"></div>
                </label>
            </div>
        </div>
    `
}

export function renderConditionalThresholdInput(config) {
    const { containerClass, inputClass, label, value, visible, placeholder = '0.00', additionalAttrs = '' } = config

    return `
        <div class="${containerClass}" style="display: ${visible ? 'block' : 'none'}">
            <label class="block text-xs secondary-text mb-1 ml-1">${label}</label>
            <input type="number" class="w-full px-3 py-2 border border-default input-bg card-text rounded-md ${inputClass} focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" value="${value || ''}" placeholder="${placeholder}" step="0.01" ${additionalAttrs}>
        </div>
    `
}

export function renderActionButton(config) {
    const { id, label, icon, primary = true, fullWidth = false, additionalClass = '' } = config
    const bgClass = primary ? 'primary-bg primary-text' : 'secondary-bg secondary-text'
    const widthClass = fullWidth ? 'w-full' : ''

    return `
        <button id="${id}" class="${widthClass} flex items-center justify-center space-x-2 cursor-pointer ${bgClass} px-4 py-3 rounded-xl hover:opacity-90 transition-colors duration-200 shadow-sm border border-default ${additionalClass}">
            ${icon ? `<span class="icon icon-${icon} h-5 w-5"></span>` : ''}
            <span class="text-base font-medium">${label}</span>
        </button>
    `
}

// ============================================================================
// CALCULATION RULES RENDERERS
// ============================================================================

export function renderFixedInputs(prefix, data) {
    return `
        <div class="mb-3">
            <label class="block text-sm font-medium secondary-text mb-1">${t('deliveryRules.amount')}</label>
            <input type="number" step="0.01" class="w-full bg-transparent border border-default rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                name="${prefix}_amount" value="${data.amount || 0}">
        </div>
    `
}

export function renderPercentageInputs(prefix, data) {
    const ratePercent = formatPercent(data.rate || 0)
    return `
        <div class="mb-3">
            <label class="block text-sm font-medium secondary-text mb-1">${t('deliveryRules.pctOrderLabel')}</label>
             <input type="number" step="0.01" class="w-full bg-transparent border border-default rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                name="${prefix}_rate" value="${ratePercent}">
        </div>
    `
}

export function renderRangeRow(type, prefix, idx, range = {}, tierValueType = 'fixed', tierValueMode = 'perUnit', unit = '', unit2 = '') {
    let inputs = ''

    const valueLabel = getValueLabel(type, tierValueType, tierValueMode, unit, unit2)

    const isPercentType = tierValueType === 'pctOrder' || tierValueType === 'pctDelivery'
    const displayValue = range.value !== undefined && range.value !== ''
        ? (isPercentType ? formatPercent(range.value) : range.value)
        : ''

    if (type === 'dimension') {
        inputs = `
            <div class="flex-1">
                <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" value="${range.maxL || ''}" name="${prefix}_range_${idx}_maxL">
            </div>
            <div class="flex-1">
                <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" value="${range.maxW || ''}" name="${prefix}_range_${idx}_maxW">
            </div>
            <div class="flex-1">
                <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" value="${range.maxH || ''}" name="${prefix}_range_${idx}_maxH">
            </div>
            <div class="flex-[1.5]">
                <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none font-medium" placeholder="0.00" value="${displayValue}" name="${prefix}_range_${idx}_value">
            </div>
        `
    } else if (type === 'weight_volume') {
        inputs = `
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" name="${prefix}_range_${idx}_maxWeight" value="${range.maxWeight || ''}">
            </div>
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" name="${prefix}_range_${idx}_maxVol" value="${range.maxVol || ''}">
            </div>
            <div class="flex-[1.5]">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none font-medium" placeholder="0.00" name="${prefix}_range_${idx}_value" value="${displayValue}">
            </div>
        `
    } else if (type === 'weight_dimension') {
        inputs = `
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" name="${prefix}_range_${idx}_maxWeight" value="${range.maxWeight || ''}">
            </div>
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" name="${prefix}_range_${idx}_maxL" value="${range.maxL || ''}">
            </div>
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" name="${prefix}_range_${idx}_maxW" value="${range.maxW || ''}">
            </div>
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-primary focus:outline-none" placeholder="∞" name="${prefix}_range_${idx}_maxH" value="${range.maxH || ''}">
            </div>
            <div class="flex-1">
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none font-medium" placeholder="0.00" name="${prefix}_range_${idx}_value" value="${displayValue}">
            </div>
        `
    } else {
        const isQuantity = type === 'quantity'
        const stepValue = isQuantity ? '1' : '0.01'
        inputs = `
            <div class="flex-[2] relative">
               <span class="absolute -top-3 left-0 w-full truncate text-[8px] secondary-text font-bold uppercase transition-opacity group-hover/row:opacity-100 opacity-60">${t('deliveryRules.startingFrom')}</span>
               <input type="number" step="${stepValue}" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none" placeholder="0" value="${range.min || 0}" name="${prefix}_range_${idx}_min">
            </div>
            <div class="flex-[2] relative">
               <span class="absolute -top-3 left-0 w-full truncate text-[8px] secondary-text font-bold uppercase transition-opacity group-hover/row:opacity-100 opacity-60">${t('deliveryRules.upTo')}</span>
               <input type="number" step="${stepValue}" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none text-center" placeholder="∞" value="${range.max || ''}" name="${prefix}_range_${idx}_max">
            </div>
            <div class="flex-[2] relative">
               <span class="absolute -top-3 left-0 w-full truncate text-[8px] secondary-text font-bold transition-opacity group-hover/row:opacity-100 opacity-60"><span class="uppercase">${t('deliveryRules.value')}</span> (${valueLabel})</span>
               <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:outline-none font-medium text-center" placeholder="0.00" value="${displayValue}" name="${prefix}_range_${idx}_value">
            </div>
        `
    }

    return `
        <div class="flex items-center gap-2 range-row bg-[hsl(var(--muted))]/50 p-1.5 rounded-lg border border-default/30 hover:border-primary/30 transition-all group/row" data-index="${idx}">
            ${inputs}
            <div class="w-8 flex-shrink-0 flex justify-center">
                <button class="remove-range-btn text-gray-400 hover:text-red-500 transition-colors p-1" data-prefix="${prefix}" data-index="${idx}">
                    <span class="icon icon-delete h-4 w-4"></span>
                </button>
            </div>
        </div>
    `
}

export function renderTieredInputs(prefix, data, type) {
    const isTiered = data.isTiered || false
    const units = getUnitOptions(type)
    let html = ''

    if (units.length > 0) {
        let defaultUnit = ''
        if (type === 'weight') defaultUnit = DEFAULT_WEIGHT_UNIT
        else if (type === 'volume') defaultUnit = DEFAULT_VOLUME_UNIT
        else if (type === 'distance') defaultUnit = DEFAULT_DISTANCE_UNIT
        else if (type === 'quantity') defaultUnit = ''

        html += `
            <div class="mb-4">
                <label class="block text-xs font-semibold secondary-text mb-1 tracking-wide">${t('deliveryRules.unit')}</label>
                <select name="${prefix}_unit" class="w-full bg-[hsl(var(--card))] border border-default rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors">
                    ${units.map(u => `<option value="${u.value}" ${(data.unit || defaultUnit) === u.value ? 'selected' : ''}>${t("attributes.units." + u.value)} (${u.label})</option>`).join('')}
                </select>
            </div>
        `
    }

    html += `
        <div class="mb-6 bg-[hsl(var(--muted))] p-1 rounded-lg inline-flex">
             <label class="px-3 py-1 rounded-md text-sm cursor-pointer transition-all ${!isTiered ? 'bg-[hsl(var(--card))] shadow-sm font-medium' : 'secondary-text'}">
                <input type="radio" name="${prefix}_mode_toggle" class="hidden is-tiered-toggle" value="single" ${!isTiered ? 'checked' : ''}>
                ${t('deliveryRules.singleRate')}
            </label>
            <label class="px-3 py-1 rounded-md text-sm cursor-pointer transition-all ${isTiered ? 'bg-[hsl(var(--card))] shadow-sm font-medium' : 'secondary-text'}">
                <input type="radio" name="${prefix}_mode_toggle" class="hidden is-tiered-toggle" value="tiered" ${isTiered ? 'checked' : ''}>
                ${t('deliveryRules.tieredPricing')}
            </label>
            <!-- Hidden actual checkbox for logic compatibility -->
            <input type="checkbox" name="${prefix}_isTiered" class="is-tiered-checkbox hidden" ${isTiered ? 'checked' : ''}>
        </div>
    `

    if (!isTiered) {
        let amountLabel = t('deliveryRules.amount')
        if (type === 'quantity') {
            amountLabel = t('deliveryRules.unitCost')
        } else if (['distance', 'weight', 'volume'].includes(type)) {
            const unitValue = data.unit || (units[0] ? units[0].value : '')
            const unitLabel = getUnitLabel(type, unitValue)
            amountLabel = `${t('deliveryRules.amount')} (${getCurrencySymbol(Store.state.currency)}/${unitLabel})`
        }

        html += `
             <div class="mb-3">
                <label class="block text-sm font-medium secondary-text mb-1">${amountLabel}</label>
                <div class="relative">
                    <input type="number" step="0.01" class="w-full bg-transparent border border-default rounded px-3 py-2 text-sm focus:border-primary focus:outline-none pl-3"
                        name="${prefix}_amount" value="${data.amount || 0}">
                </div>
            </div>
        `
    } else {
        const tierType = data.tierType || 'global'
        const tierValueType = data.tierValueType || 'fixed'
        const tierValueMode = data.tierValueMode || 'perUnit'
        const unit = data.unit || (units[0] ? units[0].value : '')

        html += `
            <div class="mb-4">
                <label class="block text-xs font-semibold secondary-text mb-2">${t('deliveryRules.tierValueMode')}</label>
                <div class="bg-[hsl(var(--muted))] p-1 rounded-lg inline-flex">
                    <label class="px-3 py-1 rounded-md text-sm cursor-pointer transition-all ${tierValueMode === 'perUnit' ? 'bg-[hsl(var(--card))] shadow-sm font-medium' : 'secondary-text'}">
                        <input type="radio" name="${prefix}_tierValueMode" value="perUnit" class="hidden tier-value-mode-toggle" ${tierValueMode === 'perUnit' ? 'checked' : ''}>
                        ${t('deliveryRules.tierValueModePerUnit')}
                    </label>
                    <label class="px-3 py-1 rounded-md text-sm cursor-pointer transition-all ${tierValueMode === 'total' ? 'bg-[hsl(var(--card))] shadow-sm font-medium' : 'secondary-text'}">
                        <input type="radio" name="${prefix}_tierValueMode" value="total" class="hidden tier-value-mode-toggle" ${tierValueMode === 'total' ? 'checked' : ''}>
                        ${t('deliveryRules.tierValueModeTotal')}
                    </label>
                </div>
                <p class="text-[10px] secondary-text italic mt-2 px-1 tier-value-mode-help">
                    ${getHelpTextForMode(type, tierValueMode)}
                </p>
            </div>
        `

        html += `
             <div class="mb-4">
                <div class="ranges-container space-y-2 mb-4" data-prefix="${prefix}" data-type="${type}" data-tier-value-type="${tierValueType}" data-tier-value-mode="${tierValueMode}" data-unit="${unit}">
                    ${(() => {
                        const shouldCreateDefaults = isTiered &&
                                                     (!data.ranges || data.ranges.length === 0) &&
                                                     ['quantity', 'distance', 'weight', 'volume'].includes(type)

                        if (shouldCreateDefaults) {
                            const minStart = type === 'quantity' ? 1 : 0
                            const maxFirst = 10
                            const minSecond = type === 'quantity' ? 11 : 10

                            data.ranges = [
                                { min: minStart, max: maxFirst, value: 0 },
                                { min: minSecond, max: null, value: 0 }
                            ]
                        }

                        return (data.ranges || []).map((range, idx) =>
                            renderRangeRow(type, prefix, idx, range, tierValueType, tierValueMode, unit)
                        ).join('')
                    })()}
                    ${(!data.ranges || data.ranges.length === 0) ? `<div class="empty-placeholder text-xs secondary-text italic text-center p-4 bg-[hsl(var(--muted))] rounded-lg border border-dashed border-default">${t('deliveryRules.noRange')}</div>` : ''}
                </div>

                <button class="add-range-btn w-full py-2 flex items-center justify-center space-x-2 text-sm font-medium text-primary hover:bg-[hsl(var(--primary))]/10 rounded-md border border-dashed border-[hsl(var(--primary))]/30 transition-all" data-prefix="${prefix}">
                    <span class="text-lg leading-none">+</span>
                    <span>${t('deliveryRules.addRange')}</span>
                </button>
            </div>

            <!-- Advanced Settings -->
            <details class="text-xs group mt-4">
                <summary class="cursor-pointer secondary-text font-medium hover:text-primary transition-colors py-2 px-3 flex items-center gap-2 select-none rounded-md hover:bg-[hsl(var(--muted))]">
                    <span class="transition-transform group-open:rotate-90">▶</span>
                    <span>${t('deliveryRules.advancedSettings') || 'Advanced Settings'}</span>
                </summary>
                <div class="mt-2 p-3 bg-[hsl(var(--muted))] rounded-lg border border-default space-y-3">
                    <div>
                        <div class="flex items-center gap-1.5 mb-1">
                            <label class="block text-xs font-semibold">${t('deliveryRules.tierType')}</label>
                            <div class="icon icon-info w-3.5 h-3.5 opacity-70 cursor-help" title="${t('deliveryRules.tierTypeHelp')}"></div>
                        </div>
                        <div class="flex space-x-6">
                            <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierType" value="global" class="sr-only peer" ${tierType === 'global' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.tierGlobal')}</span>
                            </label>
                            <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierType" value="cumulative" class="sr-only peer" ${tierType === 'cumulative' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.tierCumulative')}</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold mb-1">${t('deliveryRules.tierValueType')}</label>
                        <div class="flex flex-wrap gap-4">
                             <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierValueType" value="fixed" class="sr-only peer" ${tierValueType === 'fixed' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.valFixed')}</span>
                            </label>
                             <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierValueType" value="pctOrder" class="sr-only peer" ${tierValueType === 'pctOrder' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.valPctOrder')}</span>
                            </label>
                             <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierValueType" value="pctDelivery" class="sr-only peer" ${tierValueType === 'pctDelivery' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.valPctDelivery')}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </details>
        `
    }
    return html
}

export function renderDimensionInputs(prefix, data) {
    const isTiered = data.isTiered || false
    const units = DIMENSION_UNITS
    let html = ''

    html += `
        <div class="mb-4">
            <label class="block text-xs font-semibold secondary-text mb-1 tracking-wide">${t('deliveryRules.unit')}</label>
            <select name="${prefix}_unit" class="w-full bg-[hsl(var(--card))] border border-default rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors">
                ${units.map(u => `<option value="${u.value}" ${(data.unit || DEFAULT_DIMENSION_UNIT) === u.value ? 'selected' : ''}>${t("attributes.units." + u.value)} (${u.label})</option>`).join('')}
            </select>
        </div>
    `

    html += `
        <div class="mb-6 bg-[hsl(var(--muted))] p-1 rounded-lg inline-flex">
             <label class="px-3 py-1 rounded-md text-sm cursor-pointer transition-all ${!isTiered ? 'bg-[hsl(var(--card))] shadow-sm font-medium' : 'secondary-text'}">
                <input type="radio" name="${prefix}_mode_toggle" class="hidden is-tiered-toggle" value="single" ${!isTiered ? 'checked' : ''}>
                ${t('deliveryRules.singleRate')}
            </label>
            <label class="px-3 py-1 rounded-md text-sm cursor-pointer transition-all ${isTiered ? 'bg-[hsl(var(--card))] shadow-sm font-medium' : 'secondary-text'}">
                <input type="radio" name="${prefix}_mode_toggle" class="hidden is-tiered-toggle" value="tiered" ${isTiered ? 'checked' : ''}>
                ${t('deliveryRules.tieredPricing')}
            </label>
            <input type="checkbox" name="${prefix}_isTiered" class="is-tiered-checkbox hidden" ${isTiered ? 'checked' : ''}>
        </div>
    `

    if (!isTiered) {
        html += `
             <div class="mb-4 p-4 bg-[hsl(var(--muted))] rounded-lg border border-default/50">
                 <div class="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-xs font-semibold secondary-text mb-1">${t('deliveryRules.length')} (Max)</label>
                        <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none" name="${prefix}_maxL" value="${data.maxL || ''}" placeholder="∞">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold secondary-text mb-1">${t('deliveryRules.width')} (Max)</label>
                        <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none" name="${prefix}_maxW" value="${data.maxW || ''}" placeholder="∞">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold secondary-text mb-1">${t('deliveryRules.height')} (Max)</label>
                        <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none" name="${prefix}_maxH" value="${data.maxH || ''}" placeholder="∞">
                    </div>
                 </div>

                <div>
                    <label class="block text-xs font-semibold secondary-text mb-1">${t('deliveryRules.amount')}</label>
                    <div class="relative">
                        <input type="number" step="0.01" class="w-full bg-[hsl(var(--card))] border border-default rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none pl-3 font-medium"
                        name="${prefix}_amount" value="${data.amount || 0}">
                    </div>
                </div>
            </div>
        `
    } else {
        const tierType = data.tierType || 'global'
        const tierValueType = data.tierValueType || 'fixed'
        const tierValueMode = data.tierValueMode || 'perUnit'
        const unit = data.unit || (units[0] ? units[0].value : '')

        const valueLabel = getValueLabel('dimension', tierValueType, tierValueMode, unit)

        html += `
             <div class="mb-4">
                <p class="text-[10px] secondary-text italic mb-3 px-1 flex items-center gap-1.5">
                    <span class="icon icon-info w-3.5 h-3.5 flex-shrink-0 opacity-70"></span>
                    <span>${t('deliveryRules.tieredMaxLimitHelp')}</span>
                </p>

                <div class="flex gap-2 mb-2 text-xs font-semibold secondary-text uppercase tracking-wider pl-2 pr-2">
                    <div class="flex-1">Max ${t('deliveryRules.length')}</div>
                    <div class="flex-1">Max ${t('deliveryRules.width')}</div>
                    <div class="flex-1">Max ${t('deliveryRules.height')}</div>
                    <div class="flex-[1.5]">${t('deliveryRules.value')} (${valueLabel})</div>
                    <div class="w-8"></div>
                </div>

                <div class="ranges-container space-y-2 mb-4" data-prefix="${prefix}" data-type="dimension" data-tier-value-type="${tierValueType}" data-tier-value-mode="${tierValueMode}" data-unit="${unit}">
                     ${(data.ranges || []).map((range, idx) => renderRangeRow('dimension', prefix, idx, range, tierValueType, tierValueMode, unit)).join('')}
                    ${(!data.ranges || data.ranges.length === 0) ? `<div class="empty-placeholder text-xs secondary-text italic text-center p-4 bg-[hsl(var(--muted))] rounded-lg border border-dashed border-default">${t('deliveryRules.noRange')}</div>` : ''}
                </div>

                <button class="add-range-btn w-full py-2 flex items-center justify-center space-x-2 text-sm font-medium text-primary hover:bg-[hsl(var(--primary))]/10 rounded-md border border-dashed border-[hsl(var(--primary))]/30 transition-all" data-prefix="${prefix}">
                    <span class="text-lg leading-none">+</span>
                    <span>${t('deliveryRules.addRange')}</span>
                </button>
            </div>

            <!-- Advanced Settings -->
            <details class="text-xs group mt-4">
                <summary class="cursor-pointer secondary-text font-medium hover:text-primary transition-colors py-2 px-3 flex items-center gap-2 select-none rounded-md hover:bg-[hsl(var(--muted))]">
                    <span class="transition-transform group-open:rotate-90">▶</span>
                    <span>${t('deliveryRules.advancedSettings') || 'Advanced Settings'}</span>
                </summary>
                <div class="mt-2 p-3 bg-[hsl(var(--muted))] rounded-lg border border-default space-y-3">
                    <div>
                        <div class="flex items-center gap-1.5 mb-1">
                            <label class="block text-xs font-semibold">${t('deliveryRules.tierType')}</label>
                            <div class="icon icon-info w-3.5 h-3.5 opacity-70 cursor-help" title="${t('deliveryRules.tierTypeHelp')}"></div>
                        </div>
                        <div class="flex space-x-6">
                            <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierType" value="global" class="sr-only peer" ${tierType === 'global' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.tierGlobal')}</span>
                            </label>
                            <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierType" value="cumulative" class="sr-only peer" ${tierType === 'cumulative' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.tierCumulative')}</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold mb-1">${t('deliveryRules.tierValueType')}</label>
                        <div class="flex flex-wrap gap-4">
                             <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierValueType" value="fixed" class="sr-only peer" ${tierValueType === 'fixed' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.valFixed')}</span>
                            </label>
                             <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierValueType" value="pctOrder" class="sr-only peer" ${tierValueType === 'pctOrder' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.valPctOrder')}</span>
                            </label>
                             <label class="flex items-center cursor-pointer group">
                                <input type="radio" name="${prefix}_tierValueType" value="pctDelivery" class="sr-only peer" ${tierValueType === 'pctDelivery' ? 'checked' : ''}>
                                <div class="w-4 h-4 rounded-full border border-default flex items-center justify-center mr-2 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                    <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                </div>
                                <span class="secondary-text peer-checked:card-text transition-colors">${t('deliveryRules.valPctDelivery')}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </details>
        `
    }
    return html
}

export function renderCombinedInputs(prefix, data, type) {
    const weightUnits = WEIGHT_UNITS
    const volUnits = type === 'weight_dimension' ? DIMENSION_UNITS : VOLUME_UNITS
    const tierValueType = data.tierValueType || 'fixed'
    const tierValueMode = data.tierValueMode || 'perUnit'
    const weightUnit = data.weightUnit || (weightUnits[0] ? weightUnits[0].value : '')
    const volUnit = data.volUnit || (volUnits[0] ? volUnits[0].value : '')

    let html = ''

    const defaultVolUnit = type === 'weight_dimension' ? DEFAULT_DIMENSION_UNIT : DEFAULT_VOLUME_UNIT
    html += `<div class="flex space-x-4 mb-4">
        <div class="w-1/2">
             <label class="block text-xs font-semibold secondary-text mb-1 tracking-wide">${t('deliveryRules.weight')} ${t('deliveryRules.unit')}</label>
             <select name="${prefix}_weightUnit" class="w-full bg-[hsl(var(--card))] border border-default rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none">
                ${weightUnits.map(u => `<option value="${u.value}" ${(data.weightUnit || DEFAULT_WEIGHT_UNIT) === u.value ? 'selected' : ''}>${t("attributes.units." + u.value)} (${u.label})</option>`).join('')}
             </select>
        </div>
        <div class="w-1/2">
             <label class="block text-xs font-semibold secondary-text mb-1 tracking-wide">${type === 'weight_dimension' ? t('deliveryRules.dimension') : t('deliveryRules.volume')} ${t('deliveryRules.unit')}</label>
             <select name="${prefix}_volUnit" class="w-full bg-[hsl(var(--card))] border border-default rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none">
                ${volUnits.map(u => `<option value="${u.value}" ${(data.volUnit || defaultVolUnit) === u.value ? 'selected' : ''}>${t("attributes.units." + u.value)} (${u.label})</option>`).join('')}
             </select>
        </div>
    </div>`

    const valueLabel = getValueLabel(type, tierValueType, tierValueMode, weightUnit, volUnit)

    html += `
            <div class="mb-4">
                <p class="text-[10px] secondary-text italic mb-3 px-1 flex items-center gap-1.5">
                    <span class="icon icon-info w-3.5 h-3.5 flex-shrink-0 opacity-70"></span>
                    <span>${t('deliveryRules.tieredMaxLimitHelp')}</span>
                </p>
                <div class="flex gap-2 mb-2 text-xs font-semibold secondary-text uppercase tracking-wider pl-2 pr-2">
                    <div class="flex-1">Max ${t('deliveryRules.weight')}</div>
                    ${type === 'weight_dimension' ? `
                        <div class="flex-1">Max ${t('deliveryRules.length')}</div>
                        <div class="flex-1">Max ${t('deliveryRules.width')}</div>
                        <div class="flex-1">Max ${t('deliveryRules.height')}</div>
                        <div class="flex-1">${t('deliveryRules.value')} (${valueLabel})</div>
                    ` : `
                        <div class="flex-1">Max ${t('deliveryRules.volume')}</div>
                        <div class="flex-[1.5]">${t('deliveryRules.value')} (${valueLabel})</div>
                    `}
                    <div class="w-8"></div>
                </div>

                <div class="ranges-container space-y-2 mb-4" data-prefix="${prefix}" data-type="${type}" data-tier-value-type="${tierValueType}" data-tier-value-mode="${tierValueMode}" data-unit="${weightUnit}" data-unit2="${volUnit}">
                    ${(data.ranges || []).map((range, idx) => renderRangeRow(type, prefix, idx, range, tierValueType, tierValueMode, weightUnit, volUnit)).join('')}
                    ${(!data.ranges || data.ranges.length === 0) ? `<div class="empty-placeholder text-xs secondary-text italic text-center p-4 bg-[hsl(var(--muted))] rounded-lg border border-dashed border-default">${t('deliveryRules.noRange')}</div>` : ''}
                </div>

                <button class="add-range-btn w-full py-2 flex items-center justify-center space-x-2 text-sm font-medium text-primary hover:bg-[hsl(var(--primary))]/10 rounded-md border border-dashed border-[hsl(var(--primary))]/30 transition-all" data-prefix="${prefix}">
                    <span class="text-lg leading-none">+</span>
                    <span>${t('deliveryRules.addRange')}</span>
                </button>
            </div>
    `

    return html
}

export function renderCalculationRules(prefix, ruleData, showFreeOption = true) {
    if (!ruleData) ruleData = { type: 'fixed' }
    let type = ruleData.type || 'fixed'

    if (!showFreeOption && type === 'free') type = 'fixed'

    const session = Store.state.sessions.find(s => s.id === Store.state.currentSession)

    const allTypes = [
        { value: 'item', label: t('deliveryRules.typeItem'), help: t('deliveryRules.typeItemHelp'), always: true },
        { value: 'free', label: t('deliveryRules.freeDelivery'), help: t('deliveryRules.freeDeliveryHelp'), always: true },
        { value: 'fixed', label: t('deliveryRules.typeFixed'), help: t('deliveryRules.typeFixedHelp'), always: true },
        { value: 'percentage', label: t('deliveryRules.typePercentage'), help: t('deliveryRules.typePercentageHelp'), always: true },
        { value: 'quantity', label: t('deliveryRules.typeQuantity'), help: t('deliveryRules.typeQuantityHelp'), always: true },
        { value: 'distance', label: t('deliveryRules.typeDistance'), help: t('deliveryRules.typeDistanceHelp'), requires: ['manageDistance'] },
        { value: 'weight', label: t('deliveryRules.typeWeight'), help: t('deliveryRules.typeWeightHelp'), requires: ['manageWeight'] },
        { value: 'volume', label: t('deliveryRules.typeVolume'), help: t('deliveryRules.typeVolumeHelp'), requires: ['manageVolume'] },
        { value: 'dimension', label: t('deliveryRules.typeDimension'), help: t('deliveryRules.typeDimensionHelp'), requires: ['manageDimension'] },
        { value: 'weight_volume', label: t('deliveryRules.typeWeightVolume'), help: t('deliveryRules.typeWeightVolumeHelp'), requires: ['manageWeight', 'manageVolume'] },
        { value: 'weight_dimension', label: t('deliveryRules.typeWeightDimension'), help: t('deliveryRules.typeWeightDimensionHelp'), requires: ['manageWeight', 'manageDimension'] },
    ]

    const types = allTypes.filter(tType => {
        if (!showFreeOption && tType.value === 'free') return false
        if (tType.always) return true
        if (tType.requires) {
            return tType.requires.every(req => session && session[req])
        }
        return true
    })

    let html = `<div class="calculation-rules-container space-y-4" data-prefix="${prefix}">`

    html += `<div>
        <h5 class="text-sm font-semibold secondary-text mb-3">${t("deliveryRules.pricingType")}</h5>
        <div class="grid grid-cols-2 gap-2 mb-4">`
    types.forEach(tType => {
        const checkedStatus = type === tType.value ? 'checked' : ''
        const radioId = `${prefix}_type_${tType.value}`
        html += `
            <div class="relative group">
                <label for="${radioId}" class="flex items-center space-x-2 p-3 border border-default rounded-xl cursor-pointer hover:bg-[hsl(var(--muted))] transition-all bg-[hsl(var(--card))] has-[:checked]:bg-[hsl(var(--muted))] has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:shadow-sm has-[:checked]:ring-1 has-[:checked]:ring-[hsl(var(--primary))]/10 group">
                    <input type="radio" id="${radioId}" name="${prefix}_type" value="${tType.value}" class="calculation-type-radio sr-only peer" ${checkedStatus}>
                    <div class="w-4 h-4 flex-shrink-0 rounded-full border border-default flex items-center justify-center peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                        <div class="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span class="text-xs font-medium secondary-text peer-checked:card-text transition-colors flex-1 truncate" title="${tType.label}">${tType.label}</span>
                    <div class="icon icon-help w-3.5 h-3.5 secondary-text opacity-40 hover:opacity-100 transition-opacity cursor-help" title="${tType.help}"></div>
                </label>
            </div>
        `
    })
    html += `</div></div>`

    html += `<div class="calculation-inputs p-4 border border-default rounded bg-[hsl(var(--card))]">`

    const TYPE_RENDERERS = {
        item: () => `<p class="text-sm secondary-text italic">${t('deliveryRules.typeItem')}</p>`,
        free: () => `<p class="text-sm font-medium card-text italic">${t('deliveryRules.freeDelivery')}</p>`,
        fixed: (p, d) => renderFixedInputs(p, d),
        percentage: (p, d) => renderPercentageInputs(p, d),
        quantity: (p, d) => renderTieredInputs(p, d, 'quantity'),
        distance: (p, d) => renderTieredInputs(p, d, 'distance'),
        weight: (p, d) => renderTieredInputs(p, d, 'weight'),
        volume: (p, d) => renderTieredInputs(p, d, 'volume'),
        dimension: (p, d) => renderDimensionInputs(p, d),
        weight_volume: (p, d) => renderCombinedInputs(p, d, 'weight_volume'),
        weight_dimension: (p, d) => renderCombinedInputs(p, d, 'weight_dimension'),
    }

    const renderer = TYPE_RENDERERS[type]
    if (renderer) html += renderer(prefix, ruleData)

    html += `</div></div>`
    return html
}

// ============================================================================
// GROUP ITEM RENDERER
// ============================================================================

export function renderGroupItem(session, seller, group, gIdx, safeSellerId, getSellerProducts) {
    return `
        <div class="group-item p-4 border border-default rounded-lg bg-[hsl(var(--card))]" data-index="${gIdx}">
            <div class="flex justify-between items-center mb-4">
                <input type="text" class="group-name-input bg-transparent border-b border-default focus:border-primary focus:outline-none font-medium text-sm" value="${group.name || ''}" placeholder="${t("deliveryRules.groupName")}">
                <button class="text-red-500 hover:text-red-700 delete-group-btn transition-colors p-1">
                    <span class="icon icon-delete h-5 w-5"></span>
                </button>
            </div>
            <div class="mb-4">
                 <p class="text-xs font-semibold secondary-text mb-2 uppercase tracking-wide px-1">${t("deliveryRules.products")}</p>
                 <div class="max-h-40 overflow-y-auto border border-default rounded-lg p-2 bg-[hsl(var(--muted))] scrollbar-thin">
                     ${getSellerProducts(session, seller).map(prod => `
                        <label class="flex items-center space-x-3 py-2 px-1 cursor-pointer group">
                            <input type="checkbox" class="group-product-checkbox sr-only peer" data-seller="${seller}" data-group-index="${gIdx}" value="${prod.id}" ${group.productIds && group.productIds.includes(prod.id) ? 'checked' : ''}>
                            <div class="w-4 h-4 rounded border border-default flex items-center justify-center peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] transition-all">
                                <div class="w-1.5 h-1.5 rounded-sm bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                            </div>
                            <span class="text-sm secondary-text peer-checked:card-text transition-colors truncate" title="${prod.name}">${prod.name}</span>
                        </label>
                    `).join('')}
                 </div>
            </div>
            <div class="mb-4 bg-[hsl(var(--muted))] rounded-lg p-3 border border-default">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium card-text">${t("deliveryRules.freeDeliveryCondition")}</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="group-free-shipping-checkbox sr-only peer" ${group.freeShipping ? 'checked' : ''}>
                        <div class="toggle-switch"></div>
                    </label>
                </div>
                <div class="mt-3 group-free-shipping-threshold" style="display: ${group.freeShipping ? 'block' : 'none'}">
                    <label class="block text-xs secondary-text mb-1 ml-1">${t("deliveryRules.freeDeliveryThreshold")}</label>
                    <input type="number" class="w-full px-3 py-2 border border-default input-bg card-text rounded-md group-free-shipping-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" value="${group.freeShippingThreshold || ''}" placeholder="0.00" step="0.01">
                </div>
            </div>
            <div class="step-3-group">
                 ${renderCalculationRules(`group_${safeSellerId}_${gIdx}`, group.calculationMethod || { type: 'fixed' })}
            </div>
        </div>
    `
}

// ============================================================================
// SELLER EDITOR VIEW SECTIONS
// ============================================================================

export function renderSellerEditorHeader(seller) {
    return `
        <div class="flex items-center space-x-3 mb-4">
            <button class="muted-text p-2 cursor-pointer" id="back-to-list-button">
                <span class="icon icon-back h-8 w-8"></span>
            </button>
            <h1 class="text-2xl font-semibold card-text truncate flex-1">${seller}</h1>
        </div>
    `
}

export function renderSameSellerSelector(session, seller, copiedFrom) {
    const otherSellers = getUniqueSellers(session).filter(s => s !== seller)

    return `
        <div class="mb-6">
            <label class="block text-sm font-medium secondary-text mb-1">${t("deliveryRules.sameSellerAs")}</label>
            <select class="same-seller-select w-full px-4 py-3 border border-default input-bg card-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border-transparent" data-seller="${seller}">
                <option value="None" ${copiedFrom === 'None' ? 'selected' : ''}>${t("deliveryRules.none")}</option>
                ${otherSellers.map(s2 => `<option value="${s2}" ${copiedFrom === s2 ? 'selected' : ''}>${s2}</option>`).join('')}
            </select>
        </div>
    `
}

export function renderGlobalFreeShippingContainer(rule, billingMethod) {
    const globalFree = rule.globalFreeShipping || false
    const globalThreshold = rule.globalFreeShippingThreshold || ''
    const visible = billingMethod === 'global'

    return `
        <div class="mb-6 global-free-shipping-container bg-[hsl(var(--muted))] rounded-xl p-4 border border-default" style="display: ${visible ? 'block' : 'none'}">
            ${renderToggleSwitch({
                id: 'global-free-shipping-checkbox',
                label: t("deliveryRules.freeDeliveryCondition"),
                checked: globalFree,
                additionalAttrs: 'class="global-free-shipping-checkbox"'
            })}
            ${renderConditionalThresholdInput({
                containerClass: 'mt-3 global-free-shipping-threshold',
                inputClass: 'global-free-shipping-input',
                label: t("deliveryRules.freeDeliveryThreshold"),
                value: globalThreshold,
                visible: globalFree
            })}
        </div>
    `
}

export function renderBillingMethodSection(rule, safeSellerId) {
    const billingMethod = rule.billingMethod || 'global'

    return `
        <div class="step-1 mb-6">
            <h5 class="text-sm font-semibold secondary-text mb-2">${t("deliveryRules.billingMethod")}</h5>
            <div class="space-y-3 mb-4">
                ${renderRadioOption({
                    name: `billing-method-${safeSellerId}`,
                    value: 'global',
                    checked: billingMethod === 'global',
                    label: t("deliveryRules.sameFee"),
                    helpText: t("deliveryRules.billingMethodSameFeeHelp"),
                    additionalClasses: 'billing-method-radio'
                })}
                ${renderRadioOption({
                    name: `billing-method-${safeSellerId}`,
                    value: 'groups',
                    checked: billingMethod === 'groups',
                    label: t("deliveryRules.dependsOnProducts"),
                    helpText: t("deliveryRules.billingMethodDependsHelp"),
                    additionalClasses: 'billing-method-radio'
                })}
                ${renderRadioOption({
                    name: `billing-method-${safeSellerId}`,
                    value: 'free',
                    checked: billingMethod === 'free',
                    label: t("deliveryRules.freeDelivery"),
                    helpText: null,
                    helpIcon: false,
                    additionalClasses: 'billing-method-radio'
                })}
            </div>
            ${renderGlobalFreeShippingContainer(rule, billingMethod)}
        </div>
    `
}

export function renderGroupsSection(session, seller, rule, safeSellerId, getSellerProducts) {
    const billingMethod = rule.billingMethod || 'global'
    const visible = billingMethod === 'groups'

    return `
        <div class="step-2 mb-6" id="groups-container-${safeSellerId}" style="display: ${visible ? 'block' : 'none'}">
            <h5 class="text-sm font-semibold secondary-text mb-3 px-1">${t("deliveryRules.dependsOnProducts")}</h5>

            <div class="groups-list space-y-4 mb-6" data-seller="${seller}">
                ${(rule.groups || []).map((group, gIdx) => renderGroupItem(session, seller, group, gIdx, safeSellerId, getSellerProducts)).join('')}
            </div>

            <button class="add-group-btn w-full py-3 flex items-center justify-center space-x-2 text-sm font-semibold secondary-bg secondary-text hover:bg-[hsl(var(--muted))] rounded-xl border border-default transition-all shadow-sm" data-seller="${seller}">
                <span class="icon icon-plus h-4 w-4"></span>
                <span>${t("deliveryRules.addGroup")}</span>
            </button>
        </div>
    `
}

export function renderGlobalCalculationSection(rule, safeSellerId) {
    const billingMethod = rule.billingMethod || 'global'
    const visible = billingMethod === 'global'

    return `
        <div class="step-3-global mb-6" id="calc-global-${safeSellerId}" style="display: ${visible ? 'block' : 'none'}">
            ${renderCalculationRules(`global_${safeSellerId}`, rule.calculationMethod || {}, false)}
        </div>
    `
}

export function renderCustomsFeesSection(session, rule, seller) {
    if (!session.importFeesEnabled) return ''

    const customsFeeCurrency = rule.customsFeeCurrency || session.currency || DEFAULT_CURRENCY

    return `
        <div class="mt-6 pt-6 border-t border-default">
            <label class="block text-sm font-medium secondary-text mb-1">${t("deliveryRules.customsClearanceFees")}</label>
            <div class="flex gap-3">
                <input type="number" step="0.01" value="${rule.customsClearanceFee || 0}" class="customs-clearance-fees flex-1 px-4 py-3 border border-default input-bg card-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border-transparent" data-seller="${seller}">
                <select class="customs-clearance-currency w-40 px-3 py-3 border border-default input-bg card-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border-transparent" data-seller="${seller}">
                    ${CURRENCIES.map(curr => `<option value="${curr.code}" ${curr.code === customsFeeCurrency ? 'selected' : ''}>${curr.code} (${curr.symbol})</option>`).join('')}
                </select>
            </div>
        </div>
    `
}

export function renderCustomConfigContainer(session, seller, rule, safeSellerId, copiedFrom, getSellerProducts) {
    const visible = copiedFrom === 'None'

    return `
        <div class="custom-config-container" style="display: ${visible ? 'block' : 'none'}">
            ${renderBillingMethodSection(rule, safeSellerId)}
            ${renderGroupsSection(session, seller, rule, safeSellerId, getSellerProducts)}
            ${renderGlobalCalculationSection(rule, safeSellerId)}
            ${renderCustomsFeesSection(session, rule, seller)}
        </div>
    `
}

export function renderSaveButton() {
    return `
        <button id="save-seller-rules" class="w-full mt-8 flex items-center justify-center space-x-2 cursor-pointer primary-bg primary-text px-4 py-4 rounded-xl hover:opacity-90 transition-all shadow-md">
            <span class="text-lg font-semibold">${t("common.save")}</span>
        </button>
    `
}

// ============================================================================
// MAIN SELLER RULES VIEW
// ============================================================================

export function renderSellerRulesView({ session, seller, rule, safeSellerId, copiedFrom, getSellerProducts }) {
    return `
        <div class="mx-4 pb-8">
            ${renderSellerEditorHeader(seller)}
            <div class="seller-card card-bg rounded-xl shadow-md p-6 border border-default">
                ${renderSameSellerSelector(session, seller, copiedFrom)}
                ${renderCustomConfigContainer(session, seller, rule, safeSellerId, copiedFrom, getSellerProducts)}
                ${renderSaveButton()}
            </div>
        </div>
    `
}
