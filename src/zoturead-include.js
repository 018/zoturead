Services.scriptloader.loadSubScript(rootURI + 'zoturead-consts.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-consts.js");
Zotero.ZotURead.Consts.init({ id, version, rootURI });

Services.scriptloader.loadSubScript(rootURI + 'zoturead-dialog.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-dialog.js");

Services.scriptloader.loadSubScript(rootURI + 'zoturead-uread.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-uread.js");

Services.scriptloader.loadSubScript(rootURI + 'zoturead-collection.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-collection.js");

Services.scriptloader.loadSubScript(rootURI + 'zoturead-plugin.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-plugin.js");

Services.scriptloader.loadSubScript(rootURI + 'zoturead-searcher.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-searcher.js");

Services.scriptloader.loadSubScript(rootURI + 'zoturead-tools.js');
Zotero.ZotURead.Logger.log("loadSubScript zoturead-tools.js");