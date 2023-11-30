if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Dialogs) Zotero.ZotURead.Dialogs = {};
Components.utils.import('resource://gre/modules/Services.jsm');

Zotero.ZotURead.Dialogs = Object.assign(Zotero.ZotURead.Dialogs, {

	// http://udn.realityripple.com/docs/Web/API/Window/open#Window_features

	openSelectItems(items) {
		let io = {
			dataIn: items
		}
		Zotero.getMainWindow().openDialog('chrome://zoturead/content/selectitems/select-items.html', 'select-items', 'chrome,modal,centerscreen,scrollbars', io);
		return io.dataOut;
	},

	openArchive(dataIn) {
		let io = {
			dataIn: dataIn
		}
		Zotero.getMainWindow().openDialog('chrome://zoturead/content/archive/archive.html', 'archive', 'chrome,modal,centerscreen,scrollbars', io);
		return io.dataOut;
	}
});