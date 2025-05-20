// This script is executed on each tab while typing the search

let cached_page_text = "";
let timerID = null;
let cacheOutdatedTime = 30 * 1000; // 30 seconds
let lastCacheUpdateTime = null;

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.cmd === "scroll") {
    window.scrollTo(0, request.yoffset);
    return;
  }
  if (request.cmd === "search") {
    let searchStr = request.message;
    let text = "";

    // Update the text cache when the last request is older then 30 seconds
    // Why 30 seconds? Well that seems like a reasonable time ... :-)
    const now = Date.now();
    if (
      lastCacheUpdateTime === null ||
      now > lastCacheUpdateTime + cacheOutdatedTime
    ) {
      cached_page_text = getVisibleText(document.body).replace(/\s+/g, " ");
      lastCacheUpdateTime = now;
    }
    text = cached_page_text;

    if (!request.accentSensitive) {
      // ignore diacritics in searchbox too
      searchStr = searchStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (!request.caseSensitive) {
      text = text.toLowerCase();
      searchStr = searchStr.toLowerCase();
    }
    // get Idxs
    let idxs = getIdxsOf(searchStr, text, request.maxhits);
    let hits = [];
    for (const idx of idxs) {
      let left = text.slice(idx - 22 > 0 ? idx - 22 : 0, idx);
      let right = text.slice(
        idx + request.message.length,
        idx + request.message.length + 22,
      );
      hits.push({ left, right });
    }
    return Promise.resolve({ hits });
  }
  if (request.cmd === "regexsearch") {
    let text = "";
    let regexStr = request.message;
    text = cached_page_text;
    let idxgs = getStartEndIdxs(regexStr, text, request.maxhits);

    let hits = [];
    for (const idx of idxgs) {
      let left = text.slice(idx[0] - 22 > 0 ? idx[0] - 22 : 0, idx[0]);
      let mid = text.slice(idx[0], idx[1]);
      let right = text.slice(idx[1], idx[1] + 22);
      hits.push({ left, mid, right });
    }
    return Promise.resolve({ hits });
  }
});

function getStartEndIdxs(regexStr, str, maxhits) {
  let out_idx_groups = [];
  try {
    const regex = new RegExp(regexStr, "dgm");

    let m;

    let stop = false;
    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      //
      for (const el of m.indices) {
        out_idx_groups.push(el);
        if (out_idx_groups.length >= maxhits) {
          stop = true;
          break;
        }
      }
      if (stop) {
        break;
      }
    }
  } catch (e) {
    // console.warn(e);
  }
  return out_idx_groups;
}

function getIdxsOf(searchStr, str, maxhits) {
  var searchStrLen = searchStr.length;
  if (searchStrLen < 3) {
    return [];
  }
  var startIndex = 0,
    index,
    idxs = [];
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    idxs.push(index);
    startIndex = index + searchStrLen;
    if (idxs.length >= maxhits) {
      break;
    }
  }
  return idxs;
}

function getVisibleText(element) {
  window.getSelection().removeAllRanges();

  let range = document.createRange();
  range.selectNode(element);
  window.getSelection().addRange(range);

  let visibleText = window.getSelection().toString();
  window.getSelection().removeAllRanges();

  return visibleText;
}
