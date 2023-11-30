(function() {
	Services.scriptloader.loadSubScript(rootURI + 'chrome/content/modules/moment.min.js');

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-objects.js');
    Zotero.ZotURead.Objects.init();
	
    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-selfs.js');
    Zotero.ZotURead.Selfs.init({ id, version, rootURI });
	
	Services.scriptloader.loadSubScript(rootURI + 'chrome/content/modules/zot-logger.js');
	Zotero.ZotURead.Logger.log("loadSubScript zot-logger.js");
	Zotero.ZotURead.Logger.init();

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-zeteros.js');
    Zotero.ZotURead.Zoteros.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-zeteros.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-l10ns.js');
    Zotero.ZotURead.L10ns.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-l10ns.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-messages.js');
    Zotero.ZotURead.Messages.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-messages.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-datetimes.js');
    Zotero.ZotURead.DateTimes.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-datetimes.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-moments.js');
    Zotero.ZotURead.Moments.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-moments.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-prefs.js');
    Zotero.ZotURead.Prefs.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-prefs.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-notes.js');
    Zotero.ZotURead.Notes.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-notes.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-doms.js');
    Zotero.ZotURead.Doms.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-doms.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-events.js');
    Zotero.ZotURead.Events.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-events.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-items.js');
    Zotero.ZotURead.Items.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-items.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-searches.js');
    Zotero.ZotURead.Items.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-searches.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-collections.js');
    Zotero.ZotURead.Collections.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-collections.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-groups.js');
    Zotero.ZotURead.Groups.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-groups.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-readers.js');
    Zotero.ZotURead.Readers.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-readers.js");

    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-clipboards.js');
    Zotero.ZotURead.Clipboards.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-clipboards.js");
    
    Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-utils.js');
    Zotero.ZotURead.Utils.init();
    Zotero.ZotURead.Logger.log("loadSubScript zot-utils.js");
})();