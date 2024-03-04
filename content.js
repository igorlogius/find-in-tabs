// This sript is executed on each tab while typing the search

let cached_page_text = "";
let timerID = null;

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.cmd === "scroll") {
    window.scrollTo(0, request.yoffset);
    return;
  }
  if (request.cmd === "search") {
    //console.debug(request);
    const text = cached_page_text;
    // get Idxs
    let idxs = getIdxsOf(
      request.message,
      text,
      request.caseSensitive,
      request.maxhits
    );
    let hits = [];
    for (const idx of idxs) {
      let left = text.slice(idx - 22, idx);
      let right = text.slice(
        idx + request.message.length,
        idx + request.message.length + 22
      );
      hits.push({ left, right });
    }
    return Promise.resolve({ hits });
  }
});

function getIdxsOf(searchStr, str, caseSensitive, maxhits) {
  var searchStrLen = searchStr.length;
  if (searchStrLen < 3) {
    return [];
  }
  var startIndex = 0,
    index,
    idxs = [];
  if (!caseSensitive) {
    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    idxs.push(index);
    startIndex = index + searchStrLen;
    if (idxs.length >= maxhits) {
      break;
    }
  }
  return idxs;
}

function updateCache() {
  cached_page_text =
    document.URL +
    " " +
    document.title +
    " " +
    document.body.innerText.replace(/\s+/g, " ");
}

/*
// regular updates every 15 seconds
setInterval(updateCache, 15000);

// first time afer 3 seconds
setTimeout(updateCache, 3000);
*/

function delayed_onChange() {
  clearTimeout(timerID);
  timerID = setTimeout(updateCache, 500);
}

function init() {
  if (document.body) {
    new MutationObserver(delayed_onChange).observe(document.body, {
      attributes: false,
      childList: true,
      subtree: true,
    });
    delayed_onChange();
  }
}

// inital delay
init();
