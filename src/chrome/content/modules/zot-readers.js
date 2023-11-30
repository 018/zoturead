if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Readers) Zotero.ZotURead.Readers = {};

Zotero.ZotURead.Readers = Object.assign(Zotero.ZotURead.Readers, {
	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Readers inited.');
	},

  getSelectedReader() {
    return Zotero.Reader.getByTabID(Zotero.getMainWindow().Zotero_Tabs.selectedID);
  },

  getReaderSelectedText() {
    let currentReader = this.getSelectedReader();
    if (!currentReader) {
      return '';
    }
    let textareas = currentReader._iframeWindow.document.getElementsByTagName('textarea');

    for (let i = 0; i < textareas.length; i++) {
      if (textareas[i].style["z-index"] == -1 && textareas[i].style['width'] == '0px') {
        return textareas[i].value.replace(/(^\s*)|(\s*$)/g, '');
      }
    }
    return '';
  }
});