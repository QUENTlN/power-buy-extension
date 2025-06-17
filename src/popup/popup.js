document.addEventListener("DOMContentLoaded", () => {
  // Open sidebar
  document.getElementById("open-sidebar").addEventListener("click", () => {
    browser.sidebarAction.open()
  })

  // Scrape current page
  document.getElementById("scrape-page").addEventListener("click", () => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.runtime.sendMessage({
        action: "scrapePage",
        tabId: tabs[0].id,
      })
      browser.sidebarAction.open()
    })
  })

  // Optimize shopping
  document.getElementById("optimize").addEventListener("click", () => {
    browser.runtime.sendMessage({ action: "getCurrentSession" }).then((response) => {
      if (response.currentSession) {
        browser.runtime.sendMessage({
          action: "showOptimizationResults",
        })
      } else {
        alert("Please create a session first")
      }
    })
  })
})
