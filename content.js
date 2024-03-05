// This sript is executed on each tab while typing the search

let cached_page_text = "";
let timerID = null;

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.cmd === "scroll") {
    window.scrollTo(0, request.yoffset);
    return;
  }
  if (request.cmd === "search") {
    let searchStr = request.message;
    let text = "";
    if (!request.accentSensitive) {
      // ignore diracritics in searchbox too
      searchStr = searchStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      text = cached_page_text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } else {
      text = cached_page_text;
    }

    if (!request.caseSensitive) {
      text = text.toLowerCase();
      searchStr = searchStr.toLowerCase();
    }
    // get Idxs
    let idxs = getIdxsOf(searchStr, text, request.maxhits);
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

function stripAccents(str) {
  const rExps = [
    { re: /[\xC0-\xC6]/g, ch: "A" },
    { re: /[\xE0-\xE6]/g, ch: "a" },
    { re: /[\xC8-\xCB]/g, ch: "E" },
    { re: /[\xE8-\xEB]/g, ch: "e" },
    { re: /[\xCC-\xCF]/g, ch: "I" },
    { re: /[\xEC-\xEF]/g, ch: "i" },
    { re: /[\xD2-\xD6]/g, ch: "O" },
    { re: /[\xF2-\xF6]/g, ch: "o" },
    { re: /[\xD9-\xDC]/g, ch: "U" },
    { re: /[\xF9-\xFC]/g, ch: "u" },
    { re: /[\xD1]/g, ch: "N" },
    { re: /[\xF1]/g, ch: "n" },
  ];

  str = str.normalize();

  for (const rexp of rExps) {
    str = str.replace(rexp.re, rexp.ch);
  }

  return str;
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

function updateCache() {
  cached_page_text =
    document.URL +
    " " +
    document.title +
    " " +
    document.body.innerText.replace(/\s+/g, " ");
}

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
