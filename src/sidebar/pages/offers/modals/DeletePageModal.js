import { t } from '../../../../shared/i18n.js'
import * as actions from '../OffersActions.js'
import { Store } from '../../../state.js'
import { showConfirmationModal } from '../../../utils/index.js'

export function showDeletePageModal(pageId) {
  showConfirmationModal({
    title: t("pages.deletePage"),
    message: t("pages.confirmDelete"),
    onConfirm: async () => {
      await actions.deletePage(Store.state.currentSession, Store.state.currentProduct, pageId)
    }
  })
}
