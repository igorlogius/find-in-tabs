browser.menus.create({
  title: "Open in Sidebar",
  contexts: ["browser_action"],
  onclick: () => {
    browser.sidebarAction.open();
  },
});
