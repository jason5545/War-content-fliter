document.addEventListener('DOMContentLoaded', function () {
  // Load and set the localized messages
  document.getElementById('popup_title').textContent = chrome.i18n.getMessage('popup_title');
  document.getElementById('popup_description').textContent = chrome.i18n.getMessage('popup_description');
  document.getElementById('popup_switch_label').textContent = chrome.i18n.getMessage('popup_switch_label');
  document.getElementById('whitelist_title').textContent = chrome.i18n.getMessage('whitelist_title');
  document.getElementById('whitelist_url').placeholder = chrome.i18n.getMessage('whitelist_url_placeholder');
  document.getElementById('whitelist_add_btn').textContent = chrome.i18n.getMessage('whitelist_add_btn');
  document.getElementById('website_label').textContent = chrome.i18n.getMessage('website_label');
  document.getElementById('action_label').textContent = chrome.i18n.getMessage('action_label');

// Function to update the table with the current whitelist
  function updateWhitelistTable(whitelist) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';
    whitelist.forEach((url) => {
      const row = document.createElement('tr');
      const urlCell = document.createElement('td');
      urlCell.textContent = url;
      const actionCell = document.createElement('td');
      const removeButton = document.createElement('button');
      removeButton.textContent = chrome.i18n.getMessage('whitelist_remove_btn');
      removeButton.addEventListener('click', () => {
        // Remove the URL from the whitelist and update the table
        const updatedWhitelist = whitelist.filter((whitelistedUrl) => whitelistedUrl !== url);
        chrome.storage.sync.set({ whitelist: updatedWhitelist });
        updateWhitelistTable(updatedWhitelist);
      });
      actionCell.appendChild(removeButton);
      row.appendChild(urlCell);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    });
  }

  // Load the current whitelist and update the table
  chrome.storage.sync.get('whitelist', ({ whitelist = [] }) => {
    updateWhitelistTable(whitelist);
  });

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
		  updateWhitelistTable(whitelist);
        }
      });
    }
  });

  // Load the current whitelist from storage and populate the table
  chrome.storage.sync.get('whitelist', ({ whitelist = [] }) => {
    populateWhitelistTable(whitelist);
  });
});

function populateWhitelistTable(whitelist) {
  const tableBody = document.getElementById("whitelist-table").getElementsByTagName("tbody")[0];
  tableBody.innerHTML = "";

  whitelist.forEach((site) => {
    const row = tableBody.insertRow();
    const siteCell = row.insertCell(0);
    const actionsCell = row.insertCell(1);

    siteCell.innerText = site;

    const removeButton = document.createElement("button");
    removeButton.innerText = "Remove";
    removeButton.addEventListener("click", () => removeFromWhitelist(site));
    actionsCell.appendChild(removeButton);
  });
}

function removeFromWhitelist(siteToRemove) {
  chrome.storage.sync.get("whitelist", ({ whitelist = [] }) => {
    const updatedWhitelist = whitelist.filter((site) => site !== siteToRemove);
    chrome.storage.sync.set({ whitelist: updatedWhitelist }, () => {
      populateWhitelistTable(updatedWhitelist);
    });
  });
}
function populateWhitelistTable(whitelist) {
  const tableBody = document.getElementById("whitelist-table").getElementsByTagName("tbody")[0];
  tableBody.innerHTML = "";

  whitelist.forEach((site) => {
    const row = tableBody.insertRow();
    const siteCell = row.insertCell(0);
    const actionsCell = row.insertCell(1);

    siteCell.innerText = site;

    const removeButton = document.createElement("button");
    removeButton.innerText = chrome.i18n.getMessage('whitelist_remove_btn'); // Localized removal button text
    removeButton.addEventListener("click", () => removeFromWhitelist(site));
    actionsCell.appendChild(removeButton);
  });
}
