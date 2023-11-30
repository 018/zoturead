if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Messages) Zotero.ZotURead.Messages = {};

Zotero.ZotURead.Messages = Object.assign(Zotero.ZotURead.Messages, {
	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Messages inited.');
	},

  warning(window, message) {
    Zotero.alert(window || Zotero.getMainWindow(), Zotero.getString('general.warning'), message);
  },

  success(window, message) {
    Zotero.alert(window || Zotero.getMainWindow(), Zotero.getString('general.success'), message);
  },

  error(window, message) {
    Zotero.alert(window || Zotero.getMainWindow(), Zotero.getString('general.error'), message);
  },

  confirm(window, message) {
    var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    return ps.confirm(window || Zotero.getMainWindow(), Zotero.getString('general.warning'), message);
  }
});