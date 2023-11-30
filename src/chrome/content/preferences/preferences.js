if (!Zotero.ZotURead) Zotero.ZotURead = {};

Zotero.ZotURead.Preferences = {
	_l10n: new Localization(["preferences.ftl", "zoturead.ftl"], true),

	init: function() {
		Zotero.ZotURead.Logger.ding();
	},

	backup: function() {
		let now = Zotero.ZotURead.DateTimes.formatDate(new Date(), Zotero.ZotURead.DateTimes.yyyyMMddHHmmss);
		let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(window, this._l10n.formatValueSync('zotero-zotcard-preferences-backup'), Ci.nsIFilePicker.modeSave);
		fp.appendFilter('ZotURead Backup', '*.zotcard');
		fp.defaultString = now;
		fp.open(function (returnConstant) {
			if (returnConstant === 0) {
				let file = fp.file;
				file.QueryInterface(Ci.nsIFile);
				let backup = {
					last_updated: now,
					card_quantity: Zotero.ZotURead.Prefs.get('card_quantity'),
					word_count_style: Zotero.ZotURead.Prefs.get('word_count_style'),
					enable_word_count: Zotero.ZotURead.Prefs.get('enable_word_count'),
					startOfWeek: Zotero.ZotURead.Prefs.get('startOfWeek'),
					cardmgr_profiles: Zotero.ZotURead.Prefs.getJson('cardmgr.profiles'),
					cardmgr_savefilters: Zotero.ZotURead.Prefs.getJson('cardmgr.savefilters'),
					cardviewer_profiles: Zotero.ZotURead.Prefs.getJson('cardmgr.cardviewer_profiles'),
					recently_move_collections: Zotero.ZotURead.Prefs.getJson('movemgr.recently_move_collections'),
					movemgr_recently_move_collection_quantity: Zotero.ZotURead.Prefs.get('movemgr.recently_move_collection_quantity'),
					imagemgr_tinify_api_key: Zotero.ZotURead.Prefs.get('imagemgr.tinify_api_key'),
					meditmgr: Zotero.ZotURead.Prefs.getJson('meditmgr'),
					printcard: Zotero.ZotURead.Prefs.getJson('printcard'),
					noteBGColor: Zotero.ZotURead.Notes.getNoteBGColor()
				};

				Zotero.ZotURead.Consts.defCardTypes.forEach(type => {
					backup[type] = Zotero.ZotURead.Cards.initPrefs(type);
				});

				for (let index = 0; index < backup.card_quantity; index++) {
					const type = Zotero.ZotURead.Cards.customCardType(index);
					backup[type] = Zotero.ZotURead.Cards.initPrefs(type);
				}

				Zotero.ZotURead.Logger.log(backup);
				
				Zotero.File.putContents(Zotero.File.pathToFile(file.path + '.zotcard'), JSON.stringify(backup));
				Zotero.ZotURead.Messages.success(window, this._l10n.formatValueSync('zotero-zotcard-preferences-backup-successful'));
			}
		}.bind(this))
	},

	restore: function() {
		let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(window, this._l10n.formatValueSync('zotero-zotcard-preferences-restore'), Ci.nsIFilePicker.modeOpen);
		fp.appendFilter('ZotURead Backup', '*.zotcard');
		fp.open(function (returnConstant) {
			if (returnConstant === 0) {
				let file = fp.file;
				file.QueryInterface(Ci.nsIFile);
				let content = Zotero.File.getContents(file.path);
				if (content) {
					try {
						let backup = JSON.parse(content);
						if (backup.last_updated) {
							if (backup.card_quantity) {
								Zotero.ZotURead.Prefs.set('card_quantity', backup.card_quantity);
							} else {
								Zotero.ZotURead.Prefs.clear('card_quantity');
							}
							if (backup.word_count_style) {
								Zotero.ZotURead.Prefs.set('word_count_style', backup.word_count_style);
							} else {
								Zotero.ZotURead.Prefs.clear('word_count_style');
							}
							if (backup.enable_word_count) {
								Zotero.ZotURead.Prefs.set('enable_word_count', backup.enable_word_count);
							} else {
								Zotero.ZotURead.Prefs.clear('enable_word_count');
							}
							if (backup.startOfWeek) {
								Zotero.ZotURead.Prefs.set('startOfWeek', backup.startOfWeek);
							} else {
								Zotero.ZotURead.Prefs.clear('startOfWeek');
							}
							if (backup.cardmgr_profiles) {
								Zotero.ZotURead.Prefs.setJson('cardmgr.profiles', backup.cardmgr_profiles);
							} else {
								Zotero.ZotURead.Prefs.clear('cardmgr.profiles');
							}
							if (backup.cardmgr_savefilters) {
								Zotero.ZotURead.Prefs.setJson('cardmgr.savefilters', backup.cardmgr_savefilters);
							} else {
								Zotero.ZotURead.Prefs.clear('cardmgr.savefilters');
							}
							if (backup.cardviewer_profiles) {
								Zotero.ZotURead.Prefs.setJson('cardviewer.profiles', backup.cardviewer_profiles);
							} else {
								Zotero.ZotURead.Prefs.clear('cardviewer.profiles');
							}
							if (backup.meditmgr) {
								Zotero.ZotURead.Prefs.setJson('meditmgr', backup.meditmgr);
							} else {
								Zotero.ZotURead.Prefs.clear('meditmgr');
							}
							if (backup.movemgr_recently_move_collections) {
								Zotero.ZotURead.Prefs.setJson('movemgr.recently_move_collections', backup.movemgr_recently_move_collections);
							} else {
								Zotero.ZotURead.Prefs.clear('movemgr.recently_move_collections');
							}
							if (backup.movemgr_recently_move_collection_quantity) {
								Zotero.ZotURead.Prefs.set('movemgr.recently_move_collection_quantity', backup.movemgr_recently_move_collection_quantity);
							} else {
								Zotero.ZotURead.Prefs.clear('movemgr.recently_move_collection_quantity');
							}
							if (backup.imagemgr_tinify_api_key) {
								Zotero.ZotURead.Prefs.set('imagemgr.tinify_api_key', backup.imagemgr_tinify_api_key);
							} else {
								Zotero.ZotURead.Prefs.clear('imagemgr.tinify_api_key');
							}
							Zotero.ZotURead.Notes.noteBGColor(backup.noteBGColor);

							Zotero.ZotURead.Consts.defCardTypes.forEach(type => {
								if (backup[type]) {
									Zotero.ZotURead.Prefs.set(`${type}`, backup[type].card);
									Zotero.ZotURead.Prefs.set(`${type}.label`, backup[type].label);
									Zotero.ZotURead.Prefs.set(`${type}.visible`, backup[type].visible);
								} else {
									Zotero.ZotURead.Prefs.clear(`${type}`);
									Zotero.ZotURead.Prefs.clear(`${type}.label`);
									Zotero.ZotURead.Prefs.clear(`${type}.visible`);
								}
							});

							for (let index = 0; index < backup.card_quantity; index++) {
								const type = Zotero.ZotURead.Cards.customCardType(index);
								if (backup[type]) {
									Zotero.ZotURead.Prefs.set(`${type}`, backup[type].card);
									Zotero.ZotURead.Prefs.set(`${type}.label`, backup[type].label);
									Zotero.ZotURead.Prefs.set(`${type}.visible`, backup[type].visible);
								} else {
									Zotero.ZotURead.Prefs.clear(`${type}`);
									Zotero.ZotURead.Prefs.clear(`${type}.label`);
									Zotero.ZotURead.Prefs.clear(`${type}.visible`);
								}
							}

							Zotero.ZotURead.Messages.success(window, this._l10n.formatValueSync('zotero-zotcard-preferences-restore-successful', {last_updated: backup.last_updated}));
						} else {
							Zotero.ZotURead.Messages.warning(window, this._l10n.formatValueSync('zotero-zotcard-preferences-restore-error-file'));
						}
					} catch (e) {
						Zotero.ZotURead.Messages.warning(window, e);
					}
				} else {
					Zotero.ZotURead.Messages.warning(window, this._l10n.formatValueSync('zotero-zotcard-preferences-restore-error-file'));
				}
			}
		}.bind(this))
	},

	reset: function() {
		if (Zotero.ZotURead.Messages.confirm(window, this._l10n.formatValueSync('zotero-zotcard-preferences-reset-confirm'))) {
			Zotero.ZotURead.Consts.defCardTypes.forEach(type => {
				Zotero.ZotURead.Prefs.clear(type);
				Zotero.ZotURead.Prefs.clear(`${type}.label`);
				Zotero.ZotURead.Prefs.clear(`${type}.visible`);
			});

			let card_quantity = Zotero.ZotURead.Prefs.get('card_quantity', 0);
			for (let index = 0; index < card_quantity; index++) {
				const type = Zotero.ZotURead.Cards.customCardType(index);
				Zotero.ZotURead.Prefs.clear(`${type}`);
				Zotero.ZotURead.Prefs.clear(`${type}.label`);
				Zotero.ZotURead.Prefs.clear(`${type}.visible`);
			}
			Zotero.ZotURead.Prefs.clear('card_quantity');
			Zotero.ZotURead.Prefs.clear('word_count_style');
			Zotero.ZotURead.Prefs.clear('enable_word_count');
			Zotero.ZotURead.Prefs.clear('startOfWeek');
			Zotero.ZotURead.Prefs.clear('cardmgr.profiles');
			Zotero.ZotURead.Prefs.clear('cardmgr.savefilters');
			Zotero.ZotURead.Prefs.clear('cardviewer.profiles');
			Zotero.ZotURead.Prefs.clear('movemgr.recently_move_collections');
			Zotero.ZotURead.Prefs.clear('movemgr.recently_move_collection_quantity');
			Zotero.ZotURead.Prefs.clear('imagemgr.tinify_api_key');
			Zotero.ZotURead.Prefs.clear('meditmgr');
			Zotero.ZotURead.Prefs.clear('printcard');

			Zotero.ZotURead.Notes.noteBGColor(undefined);

			Zotero.ZotURead.Messages.success(window, this._l10n.formatValueSync('zotero-zotcard-preferences-reset-successful'));
		}
	}
}
