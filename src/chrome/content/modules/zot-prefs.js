'use strict'
if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Prefs) Zotero.ZotURead.Prefs = {};

Zotero.ZotURead.Prefs = Object.assign(Zotero.ZotURead.Prefs, {
	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.Prefs inited.');
	},

	get(pref, def) {
		let val = Zotero.Prefs.get(`${Zotero.ZotURead.Selfs.name}.${pref}`);
		// Zotero.ZotURead.Logger.log(`${pref} = ${val} `);
		return val !== undefined ? val : def;
	},

	set(pref, val) {
		if (val) {
			Zotero.Prefs.set(`${Zotero.ZotURead.Selfs.name}.${pref}`, val);
		} else {
			this.clear(pref);
		}
	},

	clear(pref) {
		Zotero.Prefs.clear(`${Zotero.ZotURead.Selfs.name}.${pref}`);
	},

	getJson(pref, def) {
		let val = Zotero.Prefs.get(`${Zotero.ZotURead.Selfs.name}.${pref}`);
		try {
			return val !== undefined ? JSON.parse(val) : def;
		} catch(e) {
			Zotero.ZotURead.Logger.log(e);
			return def;
		}
	},

	getJsonValue(pref, key, def) {
		let json = this.getJson(pref);
		return json !== undefined && json[key] ? json[key] : def;
	},

	setJson(pref, val) {
		if (val) {
			Zotero.Prefs.set(`${Zotero.ZotURead.Selfs.name}.${pref}`, JSON.stringify(val));
		} else {
			this.clear(pref);
		}
	},

	setJsonValue(pref, key, val) {
		let json = this.getJson(pref);
		if (!json) {
			json = {};
		}
		if (val) {
			json[key] = val;
		} else {
			delete json[key];
		}
		this.setJson(pref, json);
	},
});