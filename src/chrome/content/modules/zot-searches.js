if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Searches) Zotero.ZotURead.Searches = {};

Zotero.ZotURead.Searches = Object.assign(Zotero.ZotURead.Searches, {
	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Searches inited.');
	},
  
  links(searchID) {
    let links = [];
    let search = Zotero.Searches.get(searchID);
    if (search) {
      links.push({type: 'library', dataObject: Zotero.Libraries.get(search.libraryID)});
      links.push({type: 'search', dataObject: search});
      return links;
    } else {
      return false;
    }
  }
});