document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((element) => {
    const messageKey = element.getAttribute("data-i18n");
    const message = chrome.i18n.getMessage(messageKey);
    element.textContent = message;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const unblockButton = document.getElementById("temporarily-unblock-page");
  unblockButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "temporarilyUnblockPage" }, (response) => {
      if (response && response.success) {
        window.history.back();
      }
    });
  });
}); // <- This is the missing closing brace.

window.addEventListener("beforeunload", () => {
  const blockedUrl = new URL(window.location.href).searchParams.get('url');
  const host = new URL(blockedUrl).hostname;
  chrome.runtime.sendMessage({ action: "removeFromTempWhitelist", host: host });
});