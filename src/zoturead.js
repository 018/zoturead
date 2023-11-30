if (!Zotero.ZotURead) Zotero.ZotURead = {};

Zotero.ZotURead = Object.assign(Zotero.ZotURead, {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],
	addedWordElementIDs: [],
	_notifierID: 0,

	// ####### init #######

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;

		// Add a stylesheet to the main Zotero pane
		let link1 = Zotero.getMainWindow().document.createElement('link');
		link1.id = 'zoturead-stylesheet';
		link1.type = 'text/css';
		link1.rel = 'stylesheet';
		link1.href = this.rootURI + `style-${Zotero.isMac ? 'mac' : 'win'}.css`;
		Zotero.getMainWindow().document.documentElement.appendChild(link1);
		this.storeAddedElement(link1);

		// Use Fluent for localization
		Zotero.getMainWindow().MozXULElement.insertFTLIfNeeded("zoturead.ftl");


		// this.createToolbarButton();
		// this.createStandaloneMenu();
		this.createMenu();
		this.registerEvent();


		this.setUnloadUnusedTabs();

		let val = Zotero.ZotURead.Prefs.get('config.show_cover');
		if (val) {
			Zotero.ZotURead.Prefs.set('show_cover', val);
		}
		Zotero.ZotURead.Prefs.clear('config.show_cover');

		Zotero.ZotURead.Logger.log('Zotero.ZotURead inited.');
	},

	createToolbarButton() {
		let root = 'zotero-collections-toolbar';
		let zotero_collections_toolbar = Zotero.getMainWindow().document.getElementById(root);
	},

	createCollectionMenu() {
		let type = Zotero.getMainWindow().ZoteroPane.getCollectionTreeRow().type;
		Zotero.ZotURead.Logger.log(type);

		let root = 'zotero-collectionmenu';
		let zotero_collectionmenu = Zotero.getMainWindow().document.getElementById(root);

		let menuseparator = Zotero.ZotURead.Doms.createMainWindowXULMenuSeparator({
			id: `${root}-zoturead-separator1`,
			parent: zotero_collectionmenu,
		});
		this.storeAddedElement(menuseparator);

		let menuInitCollection = Zotero.ZotURead.Doms.createMainWindowXULElement('menuitem', {
			id: `${root}-uread-initCollection`,
			command: this.initCollection.bind(this),
			parent: zotero_collectionmenu,
		});
		this.storeAddedElement(menuInitCollection);
		menuInitCollection.hidden = !['collection'].includes(type);

		let menuInitClcCollection = Zotero.ZotURead.Doms.createMainWindowXULElement('menuitem', {
			id: `${root}-uread-initClcCollection`,
			command: this.initClcCollection.bind(this),
			parent: zotero_collectionmenu,
		});
		this.storeAddedElement(menuInitClcCollection);
		menuInitCollection.hidden = !['collection'].includes(type);

		let menuSelectnoncollection = Zotero.ZotURead.Doms.createMainWindowXULElement('menuitem', {
			id: `${root}-uread-selectnoncollection`,
			command: this.selectnoncollection.bind(this),
			attrs: {
				"data-l10n-id": 'zoturead-selectnoncollection-label',
			},
			parent: zotero_collectionmenu,
		});
		this.storeAddedElement(menuSelectnoncollection);
		menuInitCollection.hidden = !['library', 'collection', 'search', 'group'].includes(type);

		menuseparator.hidden = menuInitCollection.hidden && menuInitClcCollection.hidden && menuSelectnoncollection.hidden;

		let disabled = false
		var libraryID = Zotero.getMainWindow().ZoteroPane.getSelectedLibraryID();
		if (!Zotero.Libraries.get(libraryID).editable) {
		  disabled = true;
		  menuInitCollection.label = Zotero.ZotURead.L10ns.getString('zoturead-initCollection-label');
		  menuInitClcCollection.label = Zotero.ZotURead.L10ns.getString('zoturead-initClcCollection-label');
		} else {
		  let collection = Zotero.getMainWindow().ZoteroPane.getSelectedCollection();
		  if (collection) {
			if (/^\d{3,7}\. /g.exec(collection.name)) {
			  menuInitCollection.label = Zotero.ZotURead.L10ns.getString('zoturead-initcollection-new', { collectionName: collection.name });
			} else {
			  menuInitCollection.label = Zotero.ZotURead.L10ns.getString('zoturead-initCollection-label');
			}
			if (/^[A-Z][A-Z0-9-]*\. /g.exec(collection.name)) {
			  menuInitClcCollection.label = Zotero.ZotURead.L10ns.getString('zoturead-initclccollection-new', { collectionName: collection.name });
			} else {
			  menuInitClcCollection.label = Zotero.ZotURead.L10ns.getString('zoturead-initClcCollection-label');
			}
		  } else {
			disabled = true
		  }
		}
	  
		menuInitCollection.disabled = disabled;
		menuInitClcCollection.disabled = disabled;
	},

	createMenu() {
		let root = 'menu_ToolsPopup';
		let menu_ToolsPopup = Zotero.getMainWindow().document.getElementById(root);
		let menuseparator = Zotero.ZotURead.Doms.createMainWindowXULMenuSeparator({
			id: `${root}-zoturead-separator1`,
			parent: menu_ToolsPopup
		});
		this.storeAddedElement(menuseparator);

		if (!Zotero.getMainWindow().document.getElementById('zotero-collectionmenu-uread-updatetranslator')) {
			let zotero_collectionmenu_uread_updatetranslator = Zotero.getMainWindow().MozXULElement.parseXULToFragment(`
			<menu id="zotero-collectionmenu-uread-updatetranslator" data-l10n-id="zoturead-updatetranslator-label">
				<menupopup id="zotero-collectionmenu-uread-updatetranslator-menupopup">
					<menuitem id="zotero-collectionmenu-uread-refreshtranslator"
						data-l10n-id="zoturead-refreshtranslator-label"
						oncommand="Zotero.ZotURead.Plugin.refreshtranslator()" />
					<menuseparator />
					<menuitem id="zotero-collectionmenu-uread-localupdatetranslator"
						data-l10n-id="zoturead-localupdatetranslator-label"
						oncommand="Zotero.ZotURead.Plugin.localupdatetranslator()" />
					<menuseparator />
					<menuitem id="zotero-collectionmenu-uread-zoteroupdatetranslator"
						data-l10n-id="zoturead-zoteroupdatetranslator-label"
						oncommand="Zotero.ZotURead.Plugin.zoteroupdatetranslator()" />
					<menuitem id="zotero-collectionmenu-uread-dougsocietyupdatetranslator"
						data-l10n-id="zoturead-dougsocietyupdatetranslator-label"
						oncommand="Zotero.ZotURead.Plugin.dougsocietyupdatetranslator()" />
					<menuitem id="zotero-collectionmenu-uread-translatorscnupdatetranslator"
						data-l10n-id="zoturead-translatorscnupdatetranslator-label"
						oncommand="Zotero.ZotURead.Plugin.translatorscnupdatetranslator()" />
					<menuitem id="zotero-collectionmenu-uread-ureadupdatetranslator"
						data-l10n-id="zoturead-ureadupdatetranslator-label"
						oncommand="Zotero.ZotURead.Plugin.zotero018updatetranslator()" />
					<menuseparator />
					<menuitem id="zotero-collectionmenu-uread-resettranslator"
						data-l10n-id="zoturead-resettranslator-label"
						oncommand="Zotero.ZotURead.Plugin.resettranslator()" />
				</menupopup>
			</menu>`).getElementById('zotero-collectionmenu-uread-updatetranslator');
			menu_ToolsPopup.appendChild(zotero_collectionmenu_uread_updatetranslator);
			this.storeAddedElement(zotero_collectionmenu_uread_updatetranslator);
		}

		
	},

	createItemMenu() {
		let items = Zotero.ZotURead.Items.getSelectedItems();
		let itemTypes = Zotero.ZotURead.Items.getSelectedItemTypes();
		let onlyNote = itemTypes && itemTypes.length === 1 && itemTypes[0] === 'note';
		let onlyRegular = itemTypes && itemTypes.length === 1 && itemTypes[0] === 'regular';
		let onlySimple = items && items.length === 1;
		let hasNote = itemTypes && itemTypes.includes('note');
		let onlyBook = items.filter(e => !Zotero.ZotURead.Items.checkItemType(e, ['book'])).length === 0;

		Zotero.ZotURead.Logger.log({ onlyNote, onlyRegular, onlySimple });

		let root = 'zotero-itemmenu';
		let zotero_itemmenu = Zotero.getMainWindow().document.getElementById(root);
		let menuseparator = Zotero.ZotURead.Doms.createMainWindowXULMenuSeparator({
			id: `${root}-zoturead-separator1`,
			parent: zotero_itemmenu
		});
		this.storeAddedElement(menuseparator);

		if (!Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead')) {
			let zotero_itemmenu_uread = Zotero.getMainWindow().MozXULElement.parseXULToFragment(`
				<menu id="zotero-itemmenu-zoturead" data-l10n-id="zoturead-label">
					<menupopup id="zotero-itemmenu-zoturead-menupopup">
						<menuitem
							id="zotero-itemmenu-zoturead-embody"
							class="single-select-book"
							data-l10n-id="zoturead-embody-label"
							oncommand="Zotero.ZotURead.uRead.embody()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-refresh"
							data-l10n-id="zoturead-refresh-label"
							oncommand="Zotero.ZotURead.uRead.refresh()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-openaschrome"
							data-l10n-id="zoturead-openaschrome-label"
							oncommand="Zotero.ZotURead.uRead.openaschrome()"></menuitem>

						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-clcinfo"
							class="single-select-book"
							data-l10n-id="zoturead-clcinfo-label"
							oncommand="Zotero.ZotURead.uRead.clcinfo()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-subjectinfo"
							class="single-select-book"
							data-l10n-id="zoturead-subjectinfo-label"
							oncommand="Zotero.ZotURead.uRead.subjectinfo()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-publisherinfo"
							class="single-select-book"
							data-l10n-id="zoturead-publisherinfo-label"
							oncommand="Zotero.ZotURead.uRead.publisherinfo()"></menuitem>

						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-translate"
							data-l10n-id="zoturead-translate-label"
							oncommand="Zotero.ZotURead.uRead.translate()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-restoretranslate"
							class="single-select-book"
							data-l10n-id="zoturead-restoretranslate-label"
							oncommand="Zotero.ZotURead.uRead.restoretranslate()"></menuitem>

						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-catalogue-compare.add"
							data-l10n-id="zoturead-catalogue-compare-add-label"
							oncommand="Zotero.ZotURead.uRead.addCatalogueCompare()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-catalogue-compare.add"
							data-l10n-id="zoturead-catalogue-compare-start-label"
							oncommand="Zotero.ZotURead.uRead.startCatalogueCompare()"></menuitem>

						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-home"
							data-l10n-id="zoturead-label"
							oncommand="Zotero.ZotURead.uRead.home()"></menuitem>
					</menupopup>
				</menu>`).getElementById('zotero-itemmenu-zoturead');
			zotero_itemmenu.appendChild(zotero_itemmenu_uread);
			this.storeAddedElement(zotero_itemmenu_uread);
		}

		if (!Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-search')) {
			let zotero_itemmenu_uread_search = Zotero.getMainWindow().MozXULElement.parseXULToFragment(`
				<menu id="zotero-itemmenu-zoturead-search" class="single-select-book" data-l10n-id="zoturead-search-label">
					<menupopup id="zotero-itemmenu-zoturead-search-menupopup">
						<menu id="zotero-itemmenu-zoturead-search-uread" class="single-select-book" data-l10n-id="zoturead-search-uread-label">
							<menupopup id="zotero-itemmenu-zoturead-search-uread-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-uread-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('uread', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-uread-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('uread', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-uread-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('uread', 'series')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-zotero" class="single-select-book" data-l10n-id="zoturead-search-zotero-label">
							<menupopup id="zotero-itemmenu-zoturead-search-zotero-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-zotero-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('zotero', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-zotero-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('zotero', 'series')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-zotero-note"
									class="note"
									data-l10n-id="zoturead-search-note-label"
									oncommand="Zotero.ZotURead.Searcher.search('zotero', 'note')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-douban" class="single-select-book" data-l10n-id="zoturead-search-douban-label">
							<menupopup id="zotero-itemmenu-zoturead-search-douban-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-douban-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('douban', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-douban-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('douban', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-douban-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('douban', 'series')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-superlib" class="single-select-book" data-l10n-id="zoturead-search-superlib-label">
							<menupopup id="zotero-itemmenu-zoturead-search-superlib-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-superlib-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('superlib', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-superlib-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('superlib', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-superlib-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('superlib', 'series')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-jd" class="single-select-book" data-l10n-id="zoturead-search-jd-label">
							<menupopup id="zotero-itemmenu-zoturead-search-jd-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-jd-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('jd', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-jd-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('jd', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-jd-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('jd', 'series')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-dangdang" class="single-select-book" data-l10n-id="zoturead-search-dangdang-label">
							<menupopup id="zotero-itemmenu-zoturead-search-dangdang-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-dangdang-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('dangdang', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-dangdang-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('dangdang', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-dangdang-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('dangdang', 'series')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-baidu" class="single-select-book" data-l10n-id="zoturead-search-baidu-label">
							<menupopup id="zotero-itemmenu-zoturead-search-baidu-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-baidu-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('baidu', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-baidu-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('baidu', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-baidu-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('baidu', 'series')"></menuitem>
							</menupopup>
						</menu>
						<menu id="zotero-itemmenu-zoturead-search-google" class="single-select-book" data-l10n-id="zoturead-search-google-label">
							<menupopup id="zotero-itemmenu-zoturead-search-google-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-google-isbn"
									class="isbn"
									data-l10n-id="zoturead-search-isbn-label"
									oncommand="Zotero.ZotURead.Searcher.search('google', 'ISBN')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-google-title"
									class="title"
									data-l10n-id="zoturead-search-title-label"
									oncommand="Zotero.ZotURead.Searcher.search('google', 'title')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-google-series"
									class="series"
									data-l10n-id="zoturead-search-series-label"
									oncommand="Zotero.ZotURead.Searcher.search('google', 'series')"></menuitem>
							</menupopup>
						</menu>

						<menuseparator />
						<menu id="zotero-itemmenu-zoturead-search-ebook" class="single-select-book" data-l10n-id="zoturead-search-ebook-label">
							<menupopup id="zotero-itemmenu-zoturead-search-ebook-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-search-ebook-zlibrary"
									data-l10n-id="zoturead-search-ebook-zlibrary-label"
									oncommand="Zotero.ZotURead.Searcher.searchEBook('zlibrary')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-ebook-librarygenesis"
									data-l10n-id="zoturead-search-ebook-librarygenesis-label"
									oncommand="Zotero.ZotURead.Searcher.searchEBook('librarygenesis')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-ebook-xueshu86"
									data-l10n-id="zoturead-search-ebook-xueshu86-label"
									oncommand="Zotero.ZotURead.Searcher.searchEBook('xueshu86')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-ebook-lorefree"
									data-l10n-id="zoturead-search-ebook-lorefree-label"
									oncommand="Zotero.ZotURead.Searcher.searchEBook('lorefree')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-search-ebook-yabook"
									data-l10n-id="zoturead-search-ebook-yabook-label"
									tooltiptext="需要安装油猴插件今日优读才能实现点击自动搜索。"
									oncommand="Zotero.ZotURead.Searcher.searchEBook('yabook')"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-pullcatalogue"
									data-l10n-id="zoturead-weread-label"
									class="single-select-book"
									oncommand="Zotero.ZotURead.Tools.weread()"></menuitem>
							</menupopup>
						</menu>
					</menupopup>
				</menu>`).getElementById('zotero-itemmenu-zoturead-search');
			zotero_itemmenu.appendChild(zotero_itemmenu_uread_search);
			this.storeAddedElement(zotero_itemmenu_uread_search);
		}

		if (!Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-tools')) {
			let zotero_itemmenu_uread_tools = Zotero.getMainWindow().MozXULElement.parseXULToFragment(`
				<menu id="zotero-itemmenu-zoturead-tools" data-l10n-id="zoturead-tools-label">
					<menupopup id="zotero-itemmenu-zoturead-tools-menupopup">
						<menuitem
							id="zotero-itemmenu-zoturead-expandSelectedRows"
							data-l10n-id="zoturead-expandSelectedRows-label"
							oncommand="Zotero.ZotURead.Tools.expandSelectedRows()"></menuitem>
						<menuitem
							id="zotero-itemmenu-zoturead-collapseSelectedRows"
							data-l10n-id="zoturead-collapseSelectedRows-label"
							oncommand="Zotero.ZotURead.Tools.collapseSelectedRows()"></menuitem>
						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-pullcatalogue"
							data-l10n-id="zoturead-pullcatalogue-label"
							class="single-select-book"
							tooltiptext="拉目录优先级：今日优读 > 豆瓣 > 京东 > 当当"
							oncommand="Zotero.ZotURead.Tools.pullCatalogue()"></menuitem>
						<!--<menuitem
							id="zotero-itemmenu-zoturead-tryread"
							class="single-select-book"
							data-l10n-id="zoturead-tryread-label"
							oncommand="Zotero.ZotURead.Tools.tryRead()"></menuitem>-->
						<menuseparator></menuseparator>

						<menu id="zotero-itemmenu-zoturead-clearup" class="muti-select-book" data-l10n-id="zoturead-clearup-label">
							<menupopup id="zotero-itemmenu-zoturead-clearup-menupopup">
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-author"
									data-l10n-id="zoturead-clearup-author-label"
									oncommand="Zotero.ZotURead.Tools.clearupAuthor()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-nationality"
									data-l10n-id="zoturead-clearup-nationality-label"
									oncommand="Zotero.ZotURead.Tools.clearupNationality()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-other1"
									data-l10n-id="zoturead-clearup-extra1-label"
									oncommand="Zotero.ZotURead.Tools.clearupExtra1()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-other2"
									data-l10n-id="zoturead-clearup-extra2-label"
									oncommand="Zotero.ZotURead.Tools.clearupExtra2()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-title"
									data-l10n-id="zoturead-clearup-title-label"
									oncommand="Zotero.ZotURead.Tools.clearupTitle()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-abstractnote"
									data-l10n-id="zoturead-clearup-abstractnote-label"
									oncommand="Zotero.ZotURead.Tools.clearupAbstractNote()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-tags"
									data-l10n-id="zoturead-clearup-tags-label"
									oncommand="Zotero.ZotURead.Tools.clearuptags()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-mergecatalog"
									data-l10n-id="zoturead-clearup-mergecatalog-label"
									oncommand="Zotero.ZotURead.Tools.mergecatalog()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-mergename"
									data-l10n-id="zoturead-clearup-mergename-label"
									oncommand="Zotero.ZotURead.Tools.mergename()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-clearupinitial"
									data-l10n-id="zoturead-clearup-clearupinitial-label"
									oncommand="Zotero.ZotURead.Tools.clearupinitial()"></menuitem>
								<menuitem
									id="zotero-itemmenu-zoturead-clearup-clearupcomment"
									data-l10n-id="zoturead-clearup-clearupcomment-label"
									oncommand="Zotero.ZotURead.Tools.clearupcomment()"></menuitem>

								<menuseparator></menuseparator>

								<menuitem
									id="zotero-itemmenu-zoturead-clearup-clearupall"
									data-l10n-id="zoturead-clearup-clearupall-label"
									oncommand="Zotero.ZotURead.Tools.clearupAll()"></menuitem>
							</menupopup>
						</menu>

						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-updaterating"
							data-l10n-id="zoturead-updaterating-label"
							tooltiptext="更新豆瓣评分或知网引用数"
							oncommand="Zotero.ZotURead.Tools.updateRating()"></menuitem>
						<menuseparator></menuseparator>
						<!--<menuitem
							id="zotero-itemmenu-zoturead-fixclc"
							data-l10n-id="zoturead-fixclc-label"
							class="single-select-book"
							oncommand="Zotero.ZotURead.Tools.fixclc()"></menuitem>-->
						<menuitem
							id="zotero-itemmenu-zoturead-fixsubject"
							data-l10n-id="zoturead-fixsubject-label"
							oncommand="Zotero.ZotURead.Tools.fixsubject()"></menuitem>

						<menuseparator></menuseparator>

						<menuitem
							id="zotero-itemmenu-zoturead-archive"
							data-l10n-id="zoturead-archive-label"
							oncommand="Zotero.ZotURead.Tools.archive()"></menuitem>

						<!--<menuitem
							id="zotero-itemmenu-zoturead-archivebyclc"
							data-l10n-id="zoturead-archivebyclc-label"
							oncommand="Zotero.ZotURead.Tools.archivebyclc()"></menuitem>-->

						<menuseparator></menuseparator>

						<menu id="zotero-itemmenu-zoturead-location" class="single-select" data-l10n-id="zoturead-location-label">
							<menupopup id="zotero-itemmenu-zoturead-location-menupopup"></menupopup>
						</menu>
					</menupopup>
				</menu>`).getElementById('zotero-itemmenu-zoturead-tools');
			zotero_itemmenu.appendChild(zotero_itemmenu_uread_tools);
			this.storeAddedElement(zotero_itemmenu_uread_tools);
		}

		Zotero.getMainWindow().document.querySelectorAll('.single-select-book').forEach(element => {
		  element.disabled = !onlySimple || !onlyBook;
		})
		Zotero.getMainWindow().document.querySelectorAll('.muti-select-book').forEach(element => {
		  element.disabled = (items.length === 0 || !onlyBook);
		})
		Zotero.getMainWindow().document.querySelectorAll('.dynamic-author').forEach(element => {
		  element.remove()
		})
		Zotero.getMainWindow().document.querySelectorAll('.dynamic-location').forEach(element => {
		  element.remove()
		})
		Zotero.getMainWindow().document.querySelectorAll('.single-select').forEach(element => {
		  element.disabled = !onlySimple
		})

		if (onlySimple && onlyBook) {
		  let item = items[0]
		  let url = item.getField('url')
		  let clc = item.getField('archiveLocation')
		  let subject = item.getField('archive')
		  let publisher = item.getField('publisher')
		  let isbn = item.getField('ISBN').replace(/-/g, '')
		  Zotero.getMainWindow().document.querySelectorAll('.isbn').forEach(element => {
			element.label = `搜索 ${isbn} 书籍`
		  })
		  let title = item.getField('title')
		  Zotero.getMainWindow().document.querySelectorAll('.title').forEach(element => {
			element.label = `搜索 ${title.replace(/——.*$/g, '').replace(/\(.*\)$/g, '')} 书籍`
		  })
		  let series = item.getField('series')
		  Zotero.getMainWindow().document.querySelectorAll('.series').forEach(element => {
			element.disabled = !series
			element.label = `搜索 ${series ? series : '系列'} 书籍`
		  })
		  Zotero.getMainWindow().document.querySelectorAll('.note').forEach(element => {
			element.label = `搜索 ${title.replace(/——.*$/g, '').replace(/\(.*\)$/g, '')} 的笔记`
		  })
		  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-clcinfo').disabled = !clc
		  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-clcinfo').label = clc ? `查看 ${clc} 信息` : '查看中图分类信息'
		  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-subjectinfo').disabled = !subject
		  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-subjectinfo').label = subject ? `查看 ${subject} 信息` : '查看学科信息'
		  if (!Zotero.ZotURead.uRead.checkUrl(url)) {
			// 非今日优读链接
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-restoretranslate').disabled = true
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-embody').hidden = false
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-refresh').hidden = true
	  
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-publisherinfo').disabled = !publisher
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-publisherinfo').label = `搜索 ${publisher ? publisher : '出版社'} 信息`
		  } else {
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-restoretranslate').disabled = !Zotero.ZotURead.Utils.getUrlParam(url, 'src')
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-embody').hidden = true
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-refresh').hidden = false
	  
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-publisherinfo').disabled = !publisher
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-publisherinfo').label = `查看 ${publisher ? publisher : '出版社'} 信息`
		  }
	  
		  let author
		  for (const element of item.getCreators()) {
			author = element.lastName.replace(/\[.*\]/g, '').replace(/\(.*\)/g, '')
	  
			var authorSubmenu = Zotero.getMainWindow().document.createElement('menuitem')
			authorSubmenu.setAttribute('author', author)
			authorSubmenu.setAttribute('class', 'dynamic-author')
			authorSubmenu.setAttribute('label', `${!Zotero.ZotURead.uRead.checkUrl(url) ? '搜索 ' : '查看 '}${author} 信息`)
			authorSubmenu.onclick = function (e) { Zotero.ZotURead.uRead.authorsinfo(e.target.getAttribute('author')) }.bind(this)
			Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-publisherinfo').before(authorSubmenu)
	  
			Zotero.getMainWindow().document.querySelectorAll('.series').forEach(function (element) {
			  let id = element.getAttribute('id')
			  if (id) {
				let searcher = id.replace('zotero-itemmenu-zoturead-search-', '').replace('-series', '')
				let authorSubmenu = Zotero.getMainWindow().document.createElement('menuitem')
				authorSubmenu.setAttribute('author', author)
				authorSubmenu.setAttribute('class', 'dynamic-author')
				authorSubmenu.setAttribute('label', `搜索 ${author} 书籍`)
				authorSubmenu.onclick = function (e) { Zotero.ZotURead.Searcher.searchAuthor(searcher, e.target.getAttribute('author')) }.bind(this)
				element.before(authorSubmenu)
			  }
			}.bind(this))
		  }
	  
		  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-openaschrome').hidden = !Zotero.isMac || !Zotero.File.pathToFile('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome').exists()
		}
		
		if (onlyRegular && onlySimple) {
		  let locationdisabled = items[0].getCollections().length === 0;
		  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-location').disabled = locationdisabled
		  if (!locationdisabled) {
			let selectItem = Zotero.getMainWindow().ZoteroPane.getSelectedItems()[0]
			selectItem.getCollections().forEach(collection => {
			  var submenu = Zotero.getMainWindow().document.createXULElement('menuitem')
			  submenu.setAttribute('item-id', selectItem.id)
			  submenu.setAttribute('class', 'dynamic-location')
			  submenu.setAttribute('collection-id', collection)
			  submenu.setAttribute('disabled', Zotero.getMainWindow().ZoteroPane.getSelectedCollection() && Zotero.getMainWindow().ZoteroPane.getSelectedCollection().id === collection)
			  let lable = Zotero.ZotURead.Tools.showPath(collection)
			  submenu.setAttribute('label', `${lable}${Zotero.getMainWindow().ZoteroPane.getSelectedCollection() && Zotero.getMainWindow().ZoteroPane.getSelectedCollection().id === collection ? ('(当前)') : ''}`)
			  submenu.addEventListener('command', function (e) { Zotero.ZotURead.Tools.location(e.target.getAttribute('collection-id'), e.target.getAttribute('item-id')) }.bind(this));
			  Zotero.getMainWindow().document.getElementById('zotero-itemmenu-zoturead-location-menupopup').appendChild(submenu)
			})
		  }
		}
	},

	createPaneMenu() {
		let root = 'context-pane-add-child-note-button-popup';
		let elPanePopup = Zotero.getMainWindow().document.getElementById(root);
	},

	registerEvent() {
		this._notifierID = Zotero.Notifier.registerObserver(this, ['tab'], 'zoturead');

		Zotero.ZotURead.Events.register({
			itemsViewOnSelect: this.itemsViewOnSelect.bind(this),
			noteEditorKeyup: this.noteEditorKeyup.bind(this),
			refreshCollectionMenuPopup: this.refreshCollectionMenuPopup.bind(this),
			refreshItemMenuPopup: this.refreshItemMenuPopup.bind(this),
			refreshStandaloneMenuPopup: this.refreshStandaloneMenuPopup.bind(this),
			refreshPaneItemMenuPopup: this.refreshPaneItemMenuPopup.bind(this)
		});

		Zotero.Prefs.registerObserver('zoturead.max_loaded_tabs', function () {
			this.setUnloadUnusedTabs();
		}.bind(this));
	},

	setUnloadUnusedTabs() {
		var max_loaded_tabs = Zotero.ZotURead.Prefs.get('max_loaded_tabs', Services.sysinfo.getProperty("memsize") / 1024 / 1024 / 1024 <= 8 ? 3 : 5);
		Zotero.ZotURead.Logger.log({max_loaded_tabs});
		Zotero.getMainWindow().Zotero_Tabs.unloadUnusedTabs = function () {
			for (let tab of Zotero.getMainWindow().Zotero_Tabs._tabs) {
				if (Zotero.Date.getUnixTimestamp() - tab.timeUnselected > 86400) {
					Zotero.getMainWindow().Zotero_Tabs.unload(tab.id);
				}
			}
			let tabs = Zotero.getMainWindow().Zotero_Tabs._tabs.slice().filter(x => x.type === 'reader');
			tabs.sort((a, b) => b.timeUnselected - a.timeUnselected);
			tabs = tabs.slice(max_loaded_tabs);
			for (let tab of tabs) {
				Zotero.getMainWindow().Zotero_Tabs.unload(tab.id);
			}
		};
	},

	// #####################


	// ####### menu event #######

	initCollection() {
		let collection = Zotero.getMainWindow().ZoteroPane.getSelectedCollection();
		Zotero.showZoteroPaneProgressMeter(Zotero.ZotURead.L10ns.getString('zoturead-initcollection-subject-loading'));
		let name;
		if (/^\d+\. /g.exec(collection.name)) {
			name = collection.name.replace(/\..+/g, '');
		} else {
			name = 'ROOT';
		}
		Zotero.HTTP.doGet('http://api.uread.today/master/anon/subject/list?p=' + name, async (request) => {
			Zotero.hideZoteroPaneOverlays();
			if (request.status === 200) {
				let json = JSON.parse(request.responseText);
				if (json && json.resultcode === 1 && json.data.length > 0) {
					let exists = 0;
					let items = [];
					for (let index = 0; index < json.data.length; index++) {
						const element = json.data[index];
						items.push({
							id: element.code,
							label: `${element.code}. ${element.name}`,
							name: element.name,
							checked: true
						})
					}

					let dataOut = Zotero.ZotURead.Dialogs.openSelectItems(items);
					Zotero.ZotURead.Logger.log({ dataOut });
					if (dataOut) {
						for (let index = 0; index < dataOut.length; index++) {
							const element = dataOut[index];
							let code = element.id;
							let name = element.name;

							let ret = await Zotero.ZotURead.Collections.searchCollection(collection.key, code, name);
							if (!ret.added) {
								exists++;
							}
						}

						if (exists === dataOut.length) {
							Zotero.ZotURead.Messages.warning(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initcollection-subject-all-already-exist', { collectionName: collection.name }));
						} else if (exists === 0) {
							Zotero.ZotURead.Messages.success(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initcollection-subject-successful1', { collectionName: collection.name, length: dataOut.length }));
						} else {
							Zotero.ZotURead.Messages.success(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initcollection-subject-successful2', { collectionName: collection.name, length: dataOut.length - exists, exists: exists }));
						}
					}
				} else {
					Zotero.ZotURead.Messages.warning(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initcollection-subject-nothing', { collectionName: collection.name }));
				}
			} else if (request.status === 0) {
				Zotero.ZotURead.Messages.error(`${request.status} - Net Error。`)
			} else {
				Zotero.ZotURead.Messages.error(`${request.status} - ${request.statusText}`)
			}
		});
	},

	initClcCollection() {
		let collection = Zotero.getMainWindow().ZoteroPane.getSelectedCollection();
		Zotero.showZoteroPaneProgressMeter(Zotero.ZotURead.L10ns.getString('zoturead-initclccollection-clc-loading'));
		let name;
		if (/^[A-Z][A-Z0-9-]*\. /g.exec(collection.name)) {
			name = collection.name.replace(/\..+/g, '');
		} else {
			name = 'ROOT';
		}
		Zotero.HTTP.doGet('http://api.uread.today/master/anon/ch_lib_cls/list?p=' + name, async (request) => {
			Zotero.hideZoteroPaneOverlays();
			if (request.status === 200) {
				let json = JSON.parse(request.responseText);
				if (json && json.resultcode === 1 && json.data.length > 0) {
					let exists = 0;
					let items = [];
					for (let index = 0; index < json.data.length; index++) {
						const element = json.data[index];
						items.push({
							id: element.code,
							label: `${element.code}. ${element.name}`,
							name: element.name,
							checked: true
						});
					}
					let dataOut = Zotero.ZotURead.Dialogs.openSelectItems(items);
					Zotero.ZotURead.Logger.log(dataOut);
					if (dataOut) {
						for (let index = 0; index < dataOut.length; index++) {
							const element = dataOut[index];
							let code = element.id;
							let name = element.name;

							let ret = await Zotero.ZotURead.Collections.searchCollection(collection.key, code, name);
							if (!ret.added) {
								exists++
							}
						}

						if (exists === dataOut.length) {
							Zotero.ZotURead.Messages.warning(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initclccollection-clc-all-already-exist', { collectionName: collection.name }));
						} else if (exists === 0) {
							Zotero.ZotURead.Messages.success(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initclccollection-clc-successful1', { collectionName: collection.name, length: dataOut.length }));
						} else {
							Zotero.ZotURead.Messages.success(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initclccollection-clc-successful2', { collectionName: collection.name, length: dataOut.length - exists, exists: exists }));
						}
					}
				} else {
					Zotero.ZotURead.Messages.warning(undefined, Zotero.ZotURead.L10ns.getString('zoturead-initclccollection-clc-nothing', { collectionName: collection.name }));
				}
			} else if (request.status === 0) {
				Zotero.ZotURead.Messages.error(`${request.status} - Net Error。`)
			} else {
				Zotero.ZotURead.Messages.error(`${request.status} - ${request.statusText}`)
			}
		});
	},

	selectnoncollection() {
		Zotero.Items.getAll(1, true, false).then((rets) => {
			let ids = []
			rets.forEach(e => {
				if (e.getCollections().length === 0) {
					ids.push(e.id)
				}
			})
			if (ids.length === 0) {
				Zotero.ZotURead.Messages.success(undefined, Zotero.ZotURead.L10ns.getString('zoturead-selectnoncollection-successful'));
			} else {
				Zotero.getMainWindow().ZoteroPane.selectItems(ids, 1)
			}
		});
	},

	_showCover() {
		let showCover = Zotero.ZotURead.Prefs.get('show_cover', true);
		var hidden = false;
		if (showCover) {
			Zotero.ZotURead.Logger.log({ showCover });

			var items = Zotero.ZotURead.Items.getSelectedItems('book');
			if (items && items.length === 1) {
				let item = items[0];
				let notes = Zotero.Items.get(item.getNotes());
				let p = Zotero.getMainWindow().document.getElementById('cover-wrap');
				if (!p) {
					p = Zotero.getMainWindow().document.createElement('p');
					p.setAttribute('id', 'cover-wrap');
					p.style.textAlign = 'center';
					p.style.width = '100%';
					p.style.height = '150px';
					p.style.margin = '10px';
					let image = Zotero.getMainWindow().document.createElement('img');
					image.setAttribute('id', 'cover-image');
					image.style.objectFit = 'contain';
					image.style.maxWidth = '135px';
					image.style.maxHeight = '150px';
					image.style.minWidth = '135px';
					image.style.minHeight = '150px';
					p.append(image);
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.prepend(p);
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.display = 'flex';
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = 'column';
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = 'stretch';
				}
				let src;
				for (const note of notes) {
					if (note.getNoteTitle() === '目录') {
						let match = note.getNote().match(/src="(.*?)"/);
						if (match) {
							src = match[1];
							break;
						}
					}
				}
				Zotero.ZotURead.Logger.log({ src });

				let image = Zotero.getMainWindow().document.getElementById('cover-image');
				if (src) {
					image.setAttribute('src', src);
					p.hidden = false;
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.display = 'flex';
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = 'column';
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = 'stretch';
				} else {
					p.hidden = true;
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.display = '';
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = '';
					Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = '';
				}
			} else {
				hidden = true;
			}
		} else {
			hidden = true;
		}

		if (hidden) {
			let p = Zotero.getMainWindow().document.getElementById('cover-wrap');
			if (p) {
				p.hidden = true
				Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.display = '';
				Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = '';
				Zotero.getMainWindow().document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = '';
			}
		}
	},

	// #####################


	// ####### Zotero事件 #######

	notify: function (event, type, ids, extraData) {
		// 新增
		Zotero.ZotURead.Logger.log(`event:${event}, type:${type}, ids:${JSON.stringify(ids)}`);
		switch (type) {
			case 'item':
				break;

			default:
				break;
		}
	},

	itemsViewOnSelect() {
		Zotero.ZotURead.Logger.ding();
		this._showCover();
	},

	noteEditorKeyup(e) {
		// You do not need to add it. It automatically triggers itemsViewOnSelect.
	},

	refreshCollectionMenuPopup() {
		this.createCollectionMenu();
	},

	refreshItemMenuPopup(e) {
		Zotero.ZotURead.Logger.log(e.target.id);

		switch (e.target.id) {
			case 'zotero-itemmenu':
				this.createItemMenu();
				break;

			default:
				break;
		}
	},

	refreshPaneItemMenuPopup() {
		this.createPaneMenu();
	},

	refreshStandaloneMenuPopup() {
		this.createStandaloneMenu();
	},

	// #####################

	addToWindow(window) {
	},

	addToAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},

	storeAddedElement(elem) {
		if (!elem.id) {
			throw new Error("Element must have an id");
		}
		if (!this.addedElementIDs.includes(elem.id)) {
			this.addedElementIDs.push(elem.id);
		}
	},

	storeAddedWordElement(elem) {
		if (!elem.id) {
			throw new Error("Element must have an id");
		}
		if (!this.addedWordElementIDs.includes(elem.id)) {
			this.addedWordElementIDs.push(elem.id);
		}
	},

	removeAddedWordElement(prefix) {
		let dels = [];
		for (let index = this.addedWordElementIDs.length - 1; index >= 0; index--) {
			let id = this.addedWordElementIDs[index];
			if (!prefix || id.startsWith(prefix)) {
				Zotero.getMainWindow().document.getElementById(id)?.remove();
				dels.push(index);
			}
		}
		dels.forEach(index => {
			this.addedWordElementIDs.splice(index, 1);
		});
	},

	removeFromWindow(window) {
		var doc = window.document;
		// Remove all elements added to DOM
		for (let id of this.addedElementIDs) {
			doc.getElementById(id)?.remove();
		}
		doc.querySelector('[href="zoturead.ftl"]').remove();
		this.removeAddedWordElement();
	},

	removeFromAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.removeFromWindow(win);
		}
	},

	shutdown() {
		Zotero.Notifier.unregisterObserver(this.notifierID);
		Zotero.ZotURead.Events.shutdown();
	},

	async main() {
		// Global properties are included automatically in Zotero 7
		var host = new URL('https://github.com/018/zoturead').host;
		Zotero.ZotURead.Logger.log(`Host is ${host}`);

		// Retrieve a global pref
		Zotero.ZotURead.Logger.log(`Intensity is ${Zotero.Prefs.get('extensions.make-it-red.intensity', true)}`);
	},
});