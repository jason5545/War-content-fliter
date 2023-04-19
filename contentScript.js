const chineseKeywords = "战争|戰爭|战斗|戰鬥|战斗中|戰鬥中|冲突|衝突|军事|軍事|習近平|习近平|俄羅斯|俄罗斯|烏克蘭|乌克兰|台海|兩岸|軍演";
const englishKeywords = "war|battle|combat|conflict|military|Xi Jinping|Russia|Ukraine";
const warKeywordsChinese = new RegExp(`(?<=\\W)(${chineseKeywords})(?=\\W)`, "i");
const warKeywordsEnglish = new RegExp(`(?<=\\W)(${englishKeywords})(?=\\W)`, "i");

function isUrlWhitelisted(url, whitelist) {
  const currentHost = new URL(url).hostname;
  return whitelist.some((whitelistedUrl) => currentHost.includes(whitelistedUrl));
}

function pageContainsWarKeywords() {
  return warKeywordsEnglish.test(document.body.textContent) || warKeywordsChinese.test(document.body.textContent);
}

function hideWarContent() {
  if (!pageContainsWarKeywords()) {
    return;
  }

  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span');

  elements.forEach(element => {
    const textContent = element.textContent;

    if (warKeywordsEnglish.test(textContent) || warKeywordsChinese.test(textContent)) {
      element.style.display = 'none';
    }
  });
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message === "checkUrl") {
    try {
      const { whitelist = [] } = await new Promise((resolve) => chrome.storage.sync.get(["whitelist"], resolve));
      const urlIsWhitelisted = isUrlWhitelisted(location.href, whitelist);

      if (!urlIsWhitelisted) {
        hideWarContent();
      }
      sendResponse();
    } catch (error) {
      console.error("Error while handling message:", error);
    }
    return true; // Indicate that the response will be sent asynchronously
  }
});

chrome.runtime.sendMessage("checkUrl", () => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
    return;
  }
  hideWarContent();
});

// Observe DOM changes and reapply content hiding
const observer = new MutationObserver(() => {
  hideWarContent();
});

observer.observe(document.body, { childList: true, subtree: true });
