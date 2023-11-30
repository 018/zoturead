if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Groups) Zotero.ZotURead.Groups = {};

Zotero.ZotURead.Groups = Object.assign(Zotero.ZotURead.Groups, {
	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Groups inited.');
	},

  getZoteroUrl(key) {
    var groupID = this.getGroupIDByKey(key);
    return `zotero://select/groups/${groupID}/items/${key}`;
  },

  getGroupIDByKey(key) {
    var groups = Zotero.Groups.getAll()
    var groupID
    for (let index = 0; index < groups.length; index++) {
      const element = groups[index];
      if (Zotero.Items.getIDFromLibraryAndKey(element.libraryID, key)) {
        groupID = element.id
        break
      }
    }

    return groupID
  },
  
});