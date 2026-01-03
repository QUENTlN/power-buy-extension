import { t } from '../../../shared/i18n.js'
import { CURRENCIES, DEFAULT_CURRENCY } from '../../../shared/config/currencies.js'
import { renderCalculationRules } from '../../components/fees/index.js'

function renderFeeSection(prefix, label, feeData, forwarder, preset = 'simpleOnly') {
  const calcMethod = feeData?.calculationMethod || { type: 'free' }

  return `
    <div class="fee-section mb-6 p-4 border border-default rounded-lg bg-[hsl(var(--card))]">
      <h3 class="text-lg font-semibold card-text mb-4">${label}</h3>
      ${renderCalculationRules(prefix, calcMethod, {
        preset,
        currency: forwarder.currency || DEFAULT_CURRENCY
      })}
    </div>
  `
}

export function renderForwarderEditorView({ forwarder }) {
  return `
    <div class="mx-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center space-x-3">
          <button class="muted-text p-2 cursor-pointer" id="back-button">
            <span class="icon icon-back h-8 w-8"></span>
          </button>
          <h1 class="text-2xl pl-4 font-semibold card-text">${t("forwarders.editForwarder")}</h1>
        </div>
      </div>

      <!-- Forwarder Name -->
      <div class="mb-6">
        <label class="block text-sm font-medium secondary-text mb-1">${t("forwarders.forwarderName")}</label>
        <input type="text" id="forwarder-name" value="${forwarder.name}" class="w-full px-4 py-3 border border-default input-bg card-text rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
      </div>

      <!-- Currency -->
      <div class="mb-6">
        <label class="block text-sm font-medium secondary-text mb-1">${t("forwarders.currency")}</label>
        <select id="forwarder-currency" class="w-full px-4 py-3 border border-default input-bg card-text rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
          ${CURRENCIES.map(c => `<option value="${c.code}" ${(forwarder.currency || DEFAULT_CURRENCY) === c.code ? "selected" : ""}>${c.code} - ${c.label} (${c.symbol})</option>`).join('')}
        </select>
      </div>

      <!-- Fee Sections -->
      ${renderFeeSection('reception', t("forwarders.receptionFees"), forwarder.fees?.reception, forwarder, 'receptionWithQuantity')}
      ${renderFeeSection('storage', t("forwarders.storageFees"), forwarder.fees?.storage, forwarder, 'storageWithDimensionVolume')}
      ${renderFeeSection('repackaging', t("forwarders.repackagingFees"), forwarder.fees?.repackaging, forwarder, 'repackagingWithAdvanced')}
      ${renderFeeSection('reShipping', t("forwarders.reShippingFees"), forwarder.fees?.reShipping, forwarder, 'forwarderReShipping')}

      <!-- Save Button -->
      <div class="flex space-x-4 my-6">
        <button id="cancel-button" class="flex-1 px-4 py-3 secondary-bg secondary-text rounded-lg hover:opacity-90 transition-colors font-medium">
          ${t("common.cancel")}
        </button>
        <button id="save-button" class="flex-1 px-4 py-3 primary-bg primary-text rounded-lg hover:opacity-90 transition-colors font-medium">
          ${t("common.save")}
        </button>
      </div>
    </div>
  `
}
