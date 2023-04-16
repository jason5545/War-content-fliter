const chineseKeywords = "战争|戰爭|战斗|戰鬥|战斗中|戰鬥中|冲突|衝突|军事|軍事|習近平|习近平|俄羅斯|俄罗斯|烏克蘭|乌克兰|台海";
const encodedChineseKeywords = chineseKeywords
  .split("|")
  .map((keyword) => encodeURIComponent(keyword))
  .join("|");

const urlFilter = `(?<=\\W)(war|battle|combat|conflict|military|Xi Jinping|Russia|Ukraine|${encodedChineseKeywords})(?=\\W)`;

function isUrlWhitelisted(url, whitelist, tempWhitelist) {
  const currentHost = new URL(url).hostname;
  return whitelist.some((whitelistedUrl) => currentHost.includes(whitelistedUrl)) || tempWhitelist.some(entry => currentHost === entry.host && url === entry.url);
}

async function addRulesWithUniqueID() {
  let ruleID = 1001;
  let success = false;
  const rules = [
    {
      id: ruleID,
      priority: 1,
      action: {
        type: "block",
      },
      condition: {
        urlFilter: urlFilter,
        resourceTypes: ["image", "stylesheet", "font", "media", "websocket", "other"],
        domains: ["*"],
      },
    },
  ];

  while (!success) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
      success = true;
    } catch (error) {
      console.log(`Error adding rule with ID ${ruleID}: ${error.message}`);
      ruleID++;
      rules[0].id = ruleID;
    }
  }
}

function updateRules(filteringEnabled) {
  if (filteringEnabled) {
    addRulesWithUniqueID();
  } else {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      if (rules && rules.length > 0) {
        const ruleIds = rules.map((rule) => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds });
      }
    });
  }
}

chrome.storage.sync.get(["filteringEnabled", "whitelist"], ({ filteringEnabled = true, whitelist = [] }) => {
  updateRules(filteringEnabled);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.filteringEnabled) {
    updateRules(changes.filteringEnabled.newValue);
  }
});

let tempWhitelist = [];

function isUrlWhitelisted(url, whitelist) {
  const currentHost = new URL(url).hostname;
  return whitelist.some((whitelistedUrl) => currentHost.includes(whitelistedUrl)) || tempWhitelist.includes(currentHost);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "checkUrl") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length && tabs[0].url) {
        chrome.storage.sync.get(['whitelist', 'filteringEnabled'], ({ whitelist = [], filteringEnabled = true }) => {
          const urlIsWhitelisted = isUrlWhitelisted(tabs[0].url, whitelist, tempWhitelist);
          if (!urlIsWhitelisted && filteringEnabled && new RegExp(urlFilter, "i").test(tabs[0].url)) {
            chrome.tabs.update(tabs[0].id, { url: `blocked_page.html?url=${encodeURIComponent(tabs[0].url)}` });
          }
        });
      }
    });
    return true;
  } else if (message.action === "temporarilyUnblockPage") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length && tabs[0].url) {
        const blockedUrl = new URL(tabs[0].url).searchParams.get('url');
        const currentHost = new URL(blockedUrl).hostname;
        tempWhitelist.push(currentHost);
        chrome.tabs.update({ url: blockedUrl });
        sendResponse({ success: true });

        // Remove the host from the temporary whitelist after a specified time (e.g., 30 seconds)
        setTimeout(() => {
          const index = tempWhitelist.indexOf(currentHost);
          if (index !== -1) {
            tempWhitelist.splice(index, 1);
          }
        }, 30000);
      }
    });
    return true;
  } else if (message.action === "removeFromTempWhitelist") {
    const index = tempWhitelist.findIndex(entry => entry.host === message.host);
    if (index !== -1) {
      tempWhitelist.splice(index, 1);
    }
  }
});
