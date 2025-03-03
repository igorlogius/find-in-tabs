browser.menus.create({
  title: "Open in Sidebar",
  contexts: ["browser_action"],
  onclick: (tab, info) => {
    browser.sidebarAction.open();
  },
});

browser.menus.create({
  title: "Open in Tab",
  contexts: ["browser_action"],
  onclick: (tab, info) => {
    browser.tabs.create({
      url: "popup.html",
    });
  },
});

browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    let tmp = await fetch(browser.runtime.getURL("popup.css"));
    tmp = await tmp.text();
    browser.storage.local.set({ styles: tmp });
  }
});
