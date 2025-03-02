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
