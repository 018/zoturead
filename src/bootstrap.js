var chromeHandle;

function install() {
	Zotero.debug("🤪zoturead@zotero.org installed.");
}

async function startup({ id, version, rootURI }) {
	Services.scriptloader.loadSubScript(rootURI + '/chrome/content/modules/zot-include.js', { id, version, rootURI });
	Zotero.ZotURead.Logger.log("loadSubScript zot-include.js");
	
	Zotero.ZotURead.Logger.log(rootURI);
	
	Zotero.PreferencePanes.register({
		pluginID: id,
		label: 'ZotURead',
		image: 'chrome://zoturead/content/images/zoturead.png',
		src: rootURI + 'chrome/content/preferences/preferences.xhtml',
		scripts: [rootURI + 'chrome/content/preferences/preferences.js'],
		helpURL: 'https://github.com/018/zoturead',
	});

	var aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup);
    var manifestURI = Services.io.newURI(rootURI + "manifest.json");
    chromeHandle = aomStartup.registerChrome(manifestURI, [
        ["content", "zoturead", rootURI + "chrome/content/"]
    ]);

	Zotero.ZotURead.Utils.afterRun(() => {
		const data = {
			"app_name": id,
			"app_version": version,
			"machineid": Zotero.ZotURead.Utils.getCurrentUsername(),
			"machinename": Zotero.version,
			"os": Zotero.platform + `${Services.appinfo.is64Bit ? '(64bits)' : ''}`,
			"os_version": '0'
		};
		Zotero.ZotURead.Logger.log('submit to 018soft.com', data);
		Zotero.HTTP.request(
			"POST",
			'http://api.018soft.com/authorization/anon/client/submit',
			{
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data),
				timeout: 30000
			}
		);
	}, 50);
	
	Services.scriptloader.loadSubScript(rootURI + 'zoturead-include.js', { id, version, rootURI });
	Zotero.ZotURead.Logger.log("loadSubScript zoturead-include.js");
	Zotero.ZotURead.Consts.init({ id, version, rootURI });
	
	Services.scriptloader.loadSubScript(rootURI + 'zoturead.js');
	Zotero.ZotURead.Logger.log("loadSubScript zoturead.js");
	Zotero.ZotURead.init({ id, version, rootURI });

	Zotero.ZotURead.addToAllWindows();
	await Zotero.ZotURead.main();
	
}

function onMainWindowLoad({ window }) {
	Zotero.ZotURead.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	Zotero.ZotURead.removeFromWindow(window);
}

function shutdown() {
	Zotero.ZotURead.Logger.log("Shutdown.");
	chromeHandle.destruct();
	chromeHandle = null;

	Zotero.ZotURead.removeFromAllWindows();
	Zotero.ZotURead.shutdown();
	Zotero.ZotURead = undefined;
}

function uninstall() {
	Zotero.debug("🤪zoturead@zotero.org Uninstalled.");
}
