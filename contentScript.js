const chineseKeywords = "战争|戰爭|战斗|戰鬥|战斗中|戰鬥中|冲突|衝突|军事|軍事|習近平|习近平|俄羅斯|俄罗斯|烏克蘭|乌克兰|台海";
const encodedChineseKeywords = chineseKeywords
  .split("|")
  .map((keyword) => encodeURIComponent(keyword))
  .join("|");

const urlFilter = `(?<=\\W)(war|battle|combat|conflict|military|Xi Jinping|Russia|Ukraine|${encodedChineseKeywords})(?=\\W)`;

function isUrlWhitelisted(url, whitelist) {
  const currentHost = new URL(url).hostname;
  return whitelist.some((whitelistedUrl) => currentHost.includes(whitelistedUrl));
}

function blockOrUnblockPage(action) {
  if (action === "blockPage") {
    document.body.hidden = true;
  } else if (action === "unblockPage") {
    document.body.hidden = false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "checkUrl") {
    chrome.storage.sync.get(["whitelist"], ({ whitelist = [] }) => {
      const urlIsWhitelisted = isUrlWhitelisted(location.href, whitelist);
      const responseAction = !urlIsWhitelisted && new RegExp(urlFilter, "i").test(location.href) ? "blockPage" : "unblockPage";
      sendResponse({ action: responseAction });
      blockOrUnblockPage(responseAction);
    });
    return true;
  }
});

chrome.runtime.sendMessage("checkUrl", (response) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
    return;
  }
  if (response) {
    blockOrUnblockPage(response.action);
  }
});
