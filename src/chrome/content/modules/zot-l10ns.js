if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.L10ns) Zotero.ZotURead.L10ns = {};

Zotero.ZotURead.L10ns = Object.assign(Zotero.ZotURead.L10ns, {
  _l10n: new Localization(["zoturead.ftl"], true),
  
	init() {
		Zotero.ZotURead.Logger.log('Zotero.ZotURead.L10ns inited.');
	},
  
  getString(name, params) {
    if (params) {
      return this._l10n.formatValueSync(name, params);
    }

    return this._l10n.formatValueSync(name);
  },
  
  getStringFtl(ftl, name, params) {
    let l10n = new Localization([ftl], true);
    if (params) {
      return this.l10n.formatValueSync(name, params);
    }

    return this.l10n.formatValueSync(name);
  }
});