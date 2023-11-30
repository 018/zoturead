if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Collections) Zotero.ZotURead.Collections = {};

Zotero.ZotURead.Collections.loopSearchCollection = function(parentKey, subjectcode) {
  var collections;
  var libraryID = Zotero.getMainWindow().ZoteroPane.getSelectedLibraryID();
  if (parentKey) {
    let parent = Zotero.Collections.getIDFromLibraryAndKey(libraryID, parentKey);
    collections = Zotero.Collections.getByParent(parent);
  } else {
    collections = Zotero.Collections.getByLibrary(libraryID);
  }

  for (let index = 0; index < collections.length; index++) {
    const element = collections[index];
    if (new RegExp('^' + subjectcode + '\\. ').exec(element.name)) {
      return element;
    }

    let collection = Zotero.ZotURead.Collections.loopSearchCollection(element.key, subjectcode);
    if (collection) {
      return collection;
    }
  }
}

Zotero.ZotURead.Collections.searchCollection = async function(parentKey, subjectcode, subjectname) {
  var collections;
  var libraryID = Zotero.getMainWindow().ZoteroPane.getSelectedLibraryID();
  if (parentKey) {
    let parent = Zotero.Collections.getIDFromLibraryAndKey(libraryID, parentKey);
    collections = Zotero.Collections.getByParent(parent);
  } else {
    return;
  }

  let collection;
  for (let index = 0; index < collections.length; index++) {
    const element = collections[index];

    if (new RegExp('^' + subjectcode + '\\. ').exec(element.name)) {
      collection = element;
      break;
    }
  }

  let added = false
  if (!collection) {
    collection = await Zotero.ZotURead.Collections._newCollection(parentKey, subjectcode, subjectname);
    added = true;
  } else {
    added = false;
  }

  return { collection: collection, added: added };
}

Zotero.ZotURead.Collections._newCollection = async function(parentKey, subjectcode, subjectname) {
  var libraryID = Zotero.getMainWindow().ZoteroPane.getSelectedLibraryID();
  if (!Zotero.Libraries.get(libraryID).editable) {
    return false
  }

  var collection = new Zotero.Collection;
  collection.libraryID = libraryID;
  collection.name = `${subjectcode}. ${subjectname}`;
  collection.parentKey = parentKey;
  await collection.saveTx();
  return collection;
}