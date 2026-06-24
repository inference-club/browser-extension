export default defineBackground(() => {
  // With a popup defined, clicking the toolbar icon opens the popup (a small
  // quick-action menu). The popup's "Open panel" button opens the side panel.
  // So we keep openPanelOnActionClick off and let the popup drive it.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel
      ?.setPanelBehavior?.({ openPanelOnActionClick: false })
      .catch(() => {});
  });
});
