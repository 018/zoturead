if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Selfs) Zotero.ZotURead.Selfs = {};

Zotero.ZotURead.Selfs = Object.assign(Zotero.ZotURead.Selfs, {
	id: null,
  	name: null,
	version: null,
	rootURI: null,

	init({ id, version, rootURI }) {
		this.id = id;
		this.name = id.replace('@zotero.org', '');
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},
});