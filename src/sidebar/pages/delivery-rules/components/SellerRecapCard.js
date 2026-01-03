import { t } from '../../../../shared/i18n.js'
import { Store } from '../../../state.js'
import { formatPercent, formatNumber, getCurrencySymbol } from '../../../utils/formatters.js'
import { DEFAULT_CURRENCY } from '../../../../shared/config/currencies.js'

function renderCalcMethodDetails(calcMethod, currency, indent = false) {
  if (!calcMethod || !calcMethod.type) return ''
  const type = calcMethod.type
  const indentClass = indent ? 'ml-4' : ''
  let html = ''

  if (type === 'free') {
    html = `<div class="${indentClass} text-sm card-text font-medium">${t("deliveryRules.freeDelivery")}</div>`
  } else if (type === 'item') {
    html = `<div class="${indentClass} text-sm secondary-text italic">${t("deliveryRules.typeItem")}</div>`
  } else if (type === 'fixed') {
    const amount = calcMethod.amount || 0
    html = `
      <div class="${indentClass} text-sm secondary-text">
        <span class="font-medium">${t("deliveryRules.typeFixed")}:</span>
        <span class="card-text font-semibold">${formatNumber(amount)} ${getCurrencySymbol(currency)}</span>
      </div>
    `
  } else if (type === 'percentage') {
    const rate = calcMethod.rate || 0
    const base = calcMethod.base || 'order'
    const baseLabel = base === 'order' ? t("deliveryRules.baseOrder") : t("deliveryRules.baseDelivery")
    html = `
      <div class="${indentClass} text-sm secondary-text">
        <span class="font-medium">${t("deliveryRules.typePercentage")}:</span>
        <span class="card-text font-semibold">${formatPercent(rate)}%</span>
        <span class="text-xs muted-text">(${baseLabel})</span>
      </div>
    `
  } else {
    const typeLabels = {
      'quantity': t("deliveryRules.typeQuantity"),
      'distance': t("deliveryRules.typeDistance"),
      'weight': t("deliveryRules.typeWeight"),
      'volume': t("deliveryRules.typeVolume"),
      'dimension': t("deliveryRules.typeDimension"),
      'weight_volume': t("deliveryRules.typeWeightVolume"),
      'weight_dimension': t("deliveryRules.typeWeightDimension")
    }

    const ranges = calcMethod.ranges || []
    const isTiered = calcMethod.isTiered !== false && ranges.length > 0

    if (isTiered) {
      const tierValueType = calcMethod.tierValueType || 'fixed'
      const tierValueMode = calcMethod.tierValueMode || 'total'

      html = `
        <div class="${indentClass} text-sm">
          <div class="font-medium secondary-text mb-1">
            ${typeLabels[type] || type}
            <span class="text-xs muted-text font-normal ml-1">
              (${ranges.length} ${ranges.length === 1 ? t("deliveryRules.addRange").toLowerCase() : t("deliveryRules.ranges").toLowerCase()})
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="border-b border-default">
                  <th class="text-left py-1 px-2 secondary-text font-medium">${t("deliveryRules.min")}</th>
                  <th class="text-left py-1 px-2 secondary-text font-medium">${t("deliveryRules.max")}</th>
                  <th class="text-left py-1 px-2 secondary-text font-medium">${t("deliveryRules.value")}</th>
                </tr>
              </thead>
              <tbody>
                ${ranges.map((range) => {
                  const min = range.min !== undefined && range.min !== null ? formatNumber(range.min) : ''
                  const max = range.max !== undefined && range.max !== null ? formatNumber(range.max) : '∞'
                  let value = range.value || 0

                  let valueDisplay = ''
                  if (tierValueType === 'fixed') {
                    valueDisplay = `${formatNumber(value)} ${getCurrencySymbol(currency)}`
                  } else if (tierValueType === 'pctOrder' || tierValueType === 'pctDelivery') {
                    valueDisplay = `${formatPercent(value)}%`
                  }

                  if (tierValueMode === 'perUnit') {
                    valueDisplay += ` / ${t("deliveryRules.unit").toLowerCase()}`
                  }

                  return `
                    <tr class="border-b border-default/50">
                      <td class="py-1 px-2 card-text">${min}</td>
                      <td class="py-1 px-2 card-text">${max}</td>
                      <td class="py-1 px-2 card-text font-medium">${valueDisplay}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
    } else if (calcMethod.amount !== undefined) {
      const amount = calcMethod.amount || 0
      const unit = calcMethod.unit || ''
      let unitLabel = unit

      if (unit && t(`attributes.units.${unit}`)) {
        unitLabel = t(`attributes.units.${unit}`)
      }

      html = `
        <div class="${indentClass} text-sm secondary-text">
          <span class="font-medium">${typeLabels[type] || type}:</span>
          <span class="card-text font-semibold">${formatNumber(amount)} ${getCurrencySymbol(currency)}</span>
          ${unit ? `<span class="text-xs muted-text"> / ${unitLabel}</span>` : ''}
        </div>
      `
    } else {
      html = `<div class="${indentClass} text-sm muted-text italic">${typeLabels[type] || type}</div>`
    }
  }

  return html
}

export function renderSellerRecapCard(session, seller, rule) {
  const currency = rule.currency || session.currency || DEFAULT_CURRENCY
  const billingMethod = rule.billingMethod || 'global'
  const copiedFrom = rule.copiedFrom || null

  let detailsHtml = ''

  if (copiedFrom) {
    detailsHtml = `
      <div class="p-3 secondary-bg rounded-lg border border-default">
        <p class="text-sm secondary-text">
          <span class="font-medium">${t("deliveryRules.sameSellerAs")}:</span>
          <span class="card-text font-semibold">${copiedFrom}</span>
        </p>
      </div>
    `
  } else if (billingMethod === 'free') {
    detailsHtml = `
      <div class="p-3 secondary-bg rounded-lg border border-default">
        <p class="text-sm card-text font-medium">${t("deliveryRules.freeDelivery")}</p>
      </div>
    `
  } else if (billingMethod === 'global') {
    detailsHtml = `
      <div class="p-3 secondary-bg rounded-lg border border-default space-y-2">
        <p class="text-xs font-semibold secondary-text uppercase tracking-wide">${t("deliveryRules.sameFee")}</p>
        ${renderCalcMethodDetails(rule.calculationMethod, currency)}
    `
    if (rule.globalFreeShipping && rule.globalFreeShippingThreshold) {
      detailsHtml += `
        <div class="pt-2 mt-2 border-t border-default">
          <p class="text-xs secondary-text">
            <span class="font-medium">${t("deliveryRules.freeShippingThreshold")}</span>
            <span class="card-text font-semibold ml-1">${formatNumber(rule.globalFreeShippingThreshold)} ${getCurrencySymbol(currency)}</span>
          </p>
        </div>
      `
    }
    detailsHtml += `</div>`
  } else if (billingMethod === 'groups') {
    const groupCount = (rule.groups || []).length
    detailsHtml = `
      <div class="p-3 secondary-bg rounded-lg border border-default space-y-3">
        <p class="text-xs font-semibold secondary-text uppercase tracking-wide">
          ${groupCount} ${groupCount === 1 ? t("deliveryRules.addGroup") : t("deliveryRules.addGroup") + 's'}
        </p>
    `
    ;(rule.groups || []).forEach((group) => {
      const productCount = (group.productIds || []).length
      detailsHtml += `
        <div class="p-2 bg-[hsl(var(--card))] rounded border border-default/50 space-y-1">
          <div class="flex justify-between items-start">
            <p class="text-sm font-medium card-text">${group.name || t("deliveryRules.newGroupPlaceholder")}</p>
            <span class="text-xs secondary-text bg-[hsl(var(--muted))] px-2 py-0.5 rounded">
              ${productCount} ${productCount === 1 ? t("sessions.product") : t("sessions.products")}
            </span>
          </div>
          ${renderCalcMethodDetails(group.calculationMethod, currency, false)}
      `
      if (group.freeShipping && group.freeShippingThreshold) {
        detailsHtml += `
          <div class="pt-1 mt-1 border-t border-default/50">
            <p class="text-xs secondary-text">
              <span class="font-medium">${t("deliveryRules.freeShippingThreshold")}</span>
              <span class="card-text font-semibold ml-1">${formatNumber(group.freeShippingThreshold)} ${getCurrencySymbol(currency)}</span>
            </p>
          </div>
        `
      }
      detailsHtml += `</div>`
    })
    detailsHtml += `</div>`
  }

  if (session.importFeesEnabled && rule.customsClearanceFee) {
    const customsFeeCurrency = rule.customsFeeCurrency || currency
    detailsHtml += `
      <div class="p-3 mt-2 secondary-bg rounded-lg border border-default">
        <p class="text-sm secondary-text">
          <span class="font-medium">${t("deliveryRules.customsClearanceFees")}:</span>
          <span class="card-text font-semibold">${formatNumber(rule.customsClearanceFee)} ${getCurrencySymbol(customsFeeCurrency)}</span>
        </p>
      </div>
    `
  }

  return `
    <div class="card-bg rounded-xl shadow-md p-4 border border-default">
      <div class="flex justify-between items-start mb-3">
        <h4 class="text-lg font-semibold card-text">${seller}</h4>
        <button class="edit-seller-btn text-sm secondary-bg secondary-text px-4 py-2 rounded-lg hover:opacity-80 transition-colors duration-200 border border-default flex-shrink-0" data-seller="${seller}">
          ${t("common.edit")}
        </button>
      </div>
      <div class="space-y-2">
        ${detailsHtml}
      </div>
    </div>
  `
}
