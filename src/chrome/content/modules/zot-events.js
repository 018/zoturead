if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Events) Zotero.ZotURead.Events = {};

Zotero.ZotURead.Events = Object.assign(Zotero.ZotURead.Events, {
	itemsViewOnSelect: null,
	noteEditorKeyup: null,
	refreshItemMenuPopup: null,
	refreshCollectionMenuPopup: null,
	refreshStandaloneMenuPopup: null,
	refreshPaneItemMenuPopup: null,

	init() {
		// 注册事件
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Events inited.');
	},

	register({itemsViewOnSelect, noteEditorKeyup, refreshCollectionMenuPopup, refreshItemMenuPopup, refreshStandaloneMenuPopup, refreshPaneItemMenuPopup}) {
		this.itemsViewOnSelect = itemsViewOnSelect;
		this.noteEditorKeyup = noteEditorKeyup;
		this.refreshCollectionMenuPopup = refreshCollectionMenuPopup;
		this.refreshItemMenuPopup = refreshItemMenuPopup;
		this.refreshStandaloneMenuPopup = refreshStandaloneMenuPopup;
		this.refreshPaneItemMenuPopup = refreshPaneItemMenuPopup;
		
		Zotero.getMainWindow().ZoteroPane.itemsView.waitForLoad().then(function () {
			Zotero.getMainWindow().Zotero.getMainWindow().ZoteroPane.itemsView.onSelect.addListener(this.itemsViewOnSelect);
			Zotero.ZotURead.Logger.log('itemsViewOnSelect registered.');
		}.bind(this));

		Zotero.getMainWindow().document.getElementById('zotero-items-tree').addEventListener('select', this.itemsViewOnSelect.bind(this), false);
		Zotero.ZotURead.Logger.log('itemsViewOnSelect registered.');
		Zotero.getMainWindow().document.getElementById('zotero-note-editor').addEventListener('keyup', this.noteEditorKeyup, false);
		Zotero.ZotURead.Logger.log('noteEditorKeyup registered.');
		Zotero.getMainWindow().document.getElementById('zotero-collectionmenu').addEventListener('popupshowing', this.refreshCollectionMenuPopup, false);
		Zotero.ZotURead.Logger.log('refreshCollectionMenuPopup registered.');
		Zotero.getMainWindow().document.getElementById('zotero-itemmenu').addEventListener('popupshowing', this.refreshItemMenuPopup, false);
		Zotero.ZotURead.Logger.log('refreshItemMenuPopup registered.');
		Zotero.getMainWindow().document.getElementById('zotero-tb-note-add').addEventListener('popupshowing', this.refreshStandaloneMenuPopup, false);
		Zotero.ZotURead.Logger.log('refreshStandaloneMenuPopup registered.');
		Zotero.getMainWindow().document.getElementById('context-pane-add-child-note-button-popup').addEventListener('popupshowing', this.refreshPaneItemMenuPopup, false);
		Zotero.ZotURead.Logger.log('refreshPaneItemMenuPopup registered.');

		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Events registered.');
	},

	shutdown() {
		if (this.itemsViewOnSelect) {
			Zotero.getMainWindow().ZoteroPane.itemsView.onSelect.removeListener(this.itemsViewOnSelect);
			Zotero.ZotURead.Logger.log('noteEditorKeyup removed.');
		}
		if (this.noteEditorKeyup) {
			Zotero.getMainWindow().document.getElementById('zotero-note-editor').removeEventListener('keyup', this.noteEditorKeyup, false);
			Zotero.ZotURead.Logger.log('noteEditorOnKeyup removed.');
		}
		if (this.refreshCollectionMenuPopup) {
			Zotero.getMainWindow().document.getElementById('zotero-collectionmenu').removeEventListener('popupshowing', this.refreshCollectionMenuPopup, false);
			Zotero.ZotURead.Logger.log('refreshCollectionMenuPopup removed.');
		}
		if (this.refreshItemMenuPopup) {
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu').removeEventListener('popupshowing', this.refreshItemMenuPopup, false);
			Zotero.ZotURead.Logger.log('refreshItemMenuPopup removed.');
		}
		if (this.refreshStandaloneMenuPopup) {
			Zotero.getMainWindow().document.getElementById('zotero-tb-note-add').removeEventListener('popupshowing', this.refreshStandaloneMenuPopup, false);
			Zotero.ZotURead.Logger.log('refreshStandaloneMenuPopup removed.');
		}
		if (this.refreshPaneItemMenuPopup) {
			Zotero.getMainWindow().document.getElementById('context-pane-add-child-note-button-popup').removeEventListener('popupshowing', this.refreshPaneItemMenuPopup, false);
			Zotero.ZotURead.Logger.log('refreshPaneItemMenuPopup removed.');
		}
	}
});