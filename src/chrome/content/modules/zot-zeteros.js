if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Zoteros) Zotero.ZotURead.Zoteros = {};

Zotero.ZotURead.Zoteros = Object.assign(Zotero.ZotURead.Zoteros, {
	mainTabID: 'zotero-pane',

	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Zoteros inited.');
	}
});