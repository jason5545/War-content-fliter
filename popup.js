document.addEventListener('DOMContentLoaded', function () {
  // Load and set the localized messages
  document.getElementById('popup_title').textContent = chrome.i18n.getMessage('popup_title');
  document.getElementById('popup_description').textContent = chrome.i18n.getMessage('popup_description');
  document.getElementById('popup_switch_label').textContent = chrome.i18n.getMessage('popup_switch_label');
  document.getElementById('whitelist_title').textContent = chrome.i18n.getMessage('whitelist_title');
  document.getElementById('whitelist_url').placeholder = chrome.i18n.getMessage('whitelist_url_placeholder');
  document.getElementById('whitelist_add_btn').textContent = chrome.i18n.getMessage('whitelist_add_btn');

  // Get the filtering-enabled checkbox element
  const checkbox = document.getElementById('filtering-enabled');

  // Load the current filtering status from storage
  chrome.storage.sync.get('filteringEnabled', ({ filteringEnabled = true }) => {
    checkbox.checked = filteringEnabled;
  });

  // Update the filtering status when the checkbox is toggled
  checkbox.addEventListener('change', (event) => {
    chrome.storage.sync.set({ filteringEnabled: event.target.checked });
  });

  // Autofill the input field with the current website's URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length && tabs[0].url) {
      document.getElementById('whitelist_url').value = new URL(tabs[0].url).hostname;
    }
  });

  // Add website to the whitelist
  document.getElementById('whitelist_add_btn').addEventListener('click', () => {
    const urlInput = document.getElementById('whitelist_url');
    const url = urlInput.value.trim();
    if (url) {
      chrome.storage.sync.get('whitelist', ({ whitelist = [] }) => {
        if (!whitelist.includes(url)) {
          whitelist.push(url);
          chrome.storage.sync.set({ whitelist });
          urlInput.value = '';
          // Display a success message or update the UI to indicate the website has been added to the whitelist.
        }
      });
    }
  });
});
