if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Plugin) Zotero.ZotURead.Plugin = {};

Zotero.ZotURead.Plugin.refreshtranslator = function () {
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(`刷新Translator`)
  pw.show()
  Zotero.Translators.reinit()
  pw.addDescription(`成功刷新本地Translator。`)
  pw.addDescription(`只需要在浏览器执行「Advanced」-「Update Translators」即可，无需重启Zotero。`)
}

Zotero.ZotURead.Plugin.localupdatetranslator = function () {
  let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker)
  fp.init(Zotero.getMainWindow(), '选择', 3) // 多选
  fp.appendFilter('Translators', '*.js')
  fp.open(returnConstant => {
    if (returnConstant === 0) {
      let pw = new Zotero.ProgressWindow()
      pw.changeHeadline(`本地更新Translator`)
      pw.show()
      let files = fp.files
      let count = 0
      while (files.hasMoreElements()) {
        let file = files.getNext()
        let itemProgress = new pw.ItemProgress(
          `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
          `${file.leafName} ...`
        )
        itemProgress.setProgress(50)
        file.QueryInterface(Ci.nsIFile)
        file.copyTo(Zotero.getTranslatorsDirectory(), file.leafName)
        count++

        itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
        itemProgress.setText(`${file.leafName}`)
        itemProgress.setProgress(100)
      }
      Zotero.Translators.reinit()
      pw.addDescription(`成功覆盖更新 ${count} 个Translator。`)
      pw.addDescription(`只需要在浏览器执行「Advanced」-「Update Translators」即可，无需重启Zotero。`)
    }
  })
}

Zotero.ZotURead.Plugin.dougsocietyupdatetranslator = async function () {
  this._updateTranslatorByGithub('道格学社', 'https://github.com/gezhongran/DougSociety')
}

Zotero.ZotURead.Plugin.translatorscnupdatetranslator = async function () {
  this._updateTranslatorByGithub('Zotero translators 中文维护小组', 'https://github.com/l0o0/translators_CN')
}

Zotero.ZotURead.Plugin.zoteroupdatetranslator = async function () {
  this._updateTranslatorByGithub('Zotero最新官方', 'https://github.com/zotero/translators')
}

Zotero.ZotURead.Plugin.zotero018updatetranslator = async function () {
  this._updateTranslatorByGithub('018', 'https://github.com/018/zotero-translators')
}

Zotero.ZotURead.Plugin.ureadupdatetranslator = async function () {
}

Zotero.ZotURead.Plugin.resettranslator = async function () {
  if (Zotero.ZotURead.Messages.confirm(undefined, '是否重置Translator？')) {
    let pw = new Zotero.ProgressWindow()
    pw.changeHeadline('重置Translator')
    pw.show()
    let itemProgress = new pw.ItemProgress(
      `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
      `重置中...`
    )
    itemProgress.setProgress(50)
    await Zotero.Schema.resetTranslators()
    itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    itemProgress.setProgress(100)
    itemProgress.setText(`重置成功，无需重启Zotero。`)
  }
}

Zotero.ZotURead.Plugin._updateTranslatorByGithub = async function (title, host, path) {
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(`通过${title}更新Translator`)
  pw.addDescription('(点击关闭，关闭后还会继续更新)')
  pw.show()
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `数据请求中 ...`
  )
  itemProgress.setProgress(50)
  Zotero.ZotURead.Logger.log(host);
  await Zotero.ZotURead.Utils.requestAsync(host)
  
  //Zotero.HTTP.loadDocuments(`${url}/file-list/master`, async function (document1) {
  Zotero.ZotURead.Plugin._github(pw, itemProgress, `${host}/file-list/master${path ? path : ''}`, host, path);
}

Zotero.ZotURead.Plugin._github = async function (pw, itemProgress, url, host, path) {
  Zotero.HTTP.request('GET', url)
  .then(async function (request) {
    if (request.status === 200) {
      // Zotero.ZotURead.Logger.log(request.responseText);
      var document1 = (new DOMParser()).parseFromString(request.responseText, 'text/html')
      let jss = document1.querySelectorAll('.js-details-container .js-navigation-item')
      if (jss.length === 0) {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setText(`获取数据异常，请重试。`)
        itemProgress.setProgress(100)
      } else {
        let adds = 0
        let mods = 0
        let skips = 0
        let more = false
        for (let i = 0; i < jss.length; i++) {
          let a = jss[i].querySelector('a.js-navigation-open')
          let filename = a.textContent
          let href = a.href.replace(/chrome:\/\/zotero/, 'https://github.com')
          if (filename.endsWith('.js')) {
            if (itemProgress) {
              itemProgress.setIcon(`chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`)
              itemProgress.setText(`${filename} .. (${i}/${jss.length})`)
            } else {
              if (adds + mods === 20) {
                itemProgress = new pw.ItemProgress(null, `...`)
                itemProgress.setProgress(100)
                more = true
              }
              itemProgress = new pw.ItemProgress(
                `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
                `${filename} .. (${i}/${jss.length})`
              )
            }
            itemProgress.setProgress(50)
            href = 'https://github.com' + href.replace('blob', 'raw')
            let content = Zotero.File.getContentsFromURL(href)
            var tmpFile = Zotero.getMainWindow().OS.Path.join(Zotero.getTempDirectory().path, filename)
            var file1 = Zotero.File.pathToFile(tmpFile)
            await Zotero.File.putContentsAsync(tmpFile, content)
            itemProgress.setText(`${filename} .... (${i}/${jss.length})`)
            let translator1 = await Zotero.Translators.loadFromFile(tmpFile)
            var locFile = Zotero.getMainWindow().OS.Path.join(Zotero.getTranslatorsDirectory().path, filename)
            var file2 = Zotero.File.pathToFile(locFile)
            let translator2
            let need = false
            if (file2.exists()) {
              translator2 = await Zotero.Translators.loadFromFile(locFile)
    
              if (translator1.lastUpdated !== translator2.lastUpdated) {
                mods++
                need = true
              }
            } else {
              adds++
              need = true
            }
    
            if (need) {
              itemProgress.setText(`${filename} ..... (${i}/${jss.length})`)
              file1.copyTo(Zotero.getTranslatorsDirectory(), filename)
              file1.remove(null)
    
              itemProgress.setIcon(`chrome://zotero/skin/${!translator2 ? 'page-white-add' : 'treeitem-journalArticle'}${Zotero.hiDPISuffix}.png`)
              itemProgress.setProgress(100)
              itemProgress.setText(`${filename} ${!translator2 ? '新增成功。' : '覆盖成功。'}`)
              if (!more) {
                itemProgress = null
              }
            } else {
              skips++
              itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
              itemProgress.setText(`${filename} 已经是最新。`)
            }
          }
        }

        if (skips > 0) {
          if (itemProgress) {
            itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
            itemProgress.setText(`${skips} 个无需更新，已跳过。`)
            itemProgress.setProgress(100)
          } else {
            itemProgress = new pw.ItemProgress(
              `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`,
              `${skips} 个无需更新，已跳过。`
            )
            itemProgress.setProgress(100)
          }
        }
        Zotero.Translators.reinit()
        pw.show();
        pw.addDescription(`成功新增${adds}个，覆盖${mods}个，无需重启Zotero。`)
      }
    } else if (request.status === 0) {
      pw.show();
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setText(`${request.status} - 网络错误，请重试。`)
      itemProgress.setProgress(100)
    } else {
      pw.show();
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setText(`${request.status} - ${request.statusText}`)
      itemProgress.setProgress(100)
    }
  })
  .catch(function(e) {
    Zotero.ZotURead.Logger.log(url);
    Zotero.debug(e)
    
    if (url !== `${host}/file-list/main${path ? path : ''}`) {
      Zotero.ZotURead.Plugin._github(pw, itemProgress, `${host}/file-list/main${path ? path : ''}`, host, path);
    }
  })
}

