Services.scriptloader.loadSubScript('chrome://zoterouread/content/utils.js')

let plugin = {
}

plugin.localupdatetranslator = function () {
  let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker)
  fp.init(window, '选择', 3) // 多选
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
      pw.addDescription(`更新成功 ${count} 个Translator。`)
      pw.addDescription(`只需要在浏览器执行「Advanced」-「Update Translators」即可，无需重启Zotero。`)
    }
  })
}

plugin.dougsocietyupdatetranslator = async function () {
  this._updateTranslatorByGithub('道格学社', 'https://github.com/gezhongran/DougSociety')
}

plugin.zoteroupdatetranslator = async function () {
  this._updateTranslatorByGithub('Zotero最新官方', 'https://github.com/zotero/translators')
}

plugin.ureadupdatetranslator = async function () {
}

plugin.resettranslator = async function () {
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

plugin._updateTranslatorByGithub = async function (title, url) {
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(`通过${title}更新Translator`)
  pw.show()
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `数据请求中 ...`
  )
  itemProgress.setProgress(50)

  Zotero.HTTP.loadDocuments(`${url}/file-list/master`, async function (document1) {
    let jss = document1.querySelectorAll('.js-details-container .js-navigation-item')
    let adds = 0
    let mods = 0
    let skips = 0
    let more = false
    for (let i = 0; i < jss.length; i++) {
      let a = jss[i].querySelector('a.js-navigation-open')
      let filename = a.textContent
      let href = a.href
      if (filename.endsWith('.js')) {
        if (itemProgress) {
          itemProgress.setIcon(`chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`)
          itemProgress.setText(`${filename} ... (${i}/${jss.length})`)
        } else {
          if (adds + mods === 20) {
            itemProgress = new pw.ItemProgress(null, `...`)
            itemProgress.setProgress(100)
            more = true
          }
          itemProgress = new pw.ItemProgress(
            `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
            `${filename} ... (${i}/${jss.length})`
          )
        }
        itemProgress.setProgress(50)
        let document2 = await Utils.loadDocumentAsync(href)
        let content = Zotero.File.getContentsFromURL(document2.getElementById('raw-url').href)
        var tmpFile = OS.Path.join(Zotero.getTempDirectory().path, filename)
        var file1 = Zotero.File.pathToFile(tmpFile)
        await Zotero.File.putContentsAsync(tmpFile, content)
        let translator1 = await Zotero.Translators.loadFromFile(tmpFile)
        Zotero.debug(`远程lastUpdated: ${translator1.lastUpdated}`)

        var locFile = OS.Path.join(Zotero.getTranslatorsDirectory().path, filename)
        var file2 = Zotero.File.pathToFile(locFile)
        let translator2
        let need = false
        if (file2.exists()) {
          translator2 = await Zotero.Translators.loadFromFile(locFile)

          Zotero.debug(`本地lastUpdated: ${translator2.lastUpdated}`)
          if (translator1.lastUpdated !== translator2.lastUpdated) {
            mods++
            need = true
          }
        } else {
          Zotero.debug(`${locFile} 本地不存在。`)
          adds++
          need = true
        }

        if (need) {
          file1.copyTo(Zotero.getTranslatorsDirectory(), filename)
          file1.remove(null)
          Zotero.debug(`${filename} 更新成功。`)

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
    pw.addDescription(`成功新增${adds}个，覆盖${mods}个，无需重启Zotero。`)
  },
  null,
  function (e) {
    pw.addDescription(e)
  })
}

if (typeof window !== 'undefined') {
  // API export for Zotero UI
  // Can't imagine those to not exist tbh
  if (!window.Zotero) window.Zotero = {}
  if (!window.Zotero.uRead) window.Zotero.uRead = {}
  if (!window.Zotero.uRead.Plugin) window.Zotero.uRead.Plugin = {}
  // note sure about any of this

  window.Zotero.uRead.Plugin.localupdatetranslator = function () { plugin.localupdatetranslator() }
  window.Zotero.uRead.Plugin.dougsocietyupdatetranslator = function () { plugin.dougsocietyupdatetranslator() }
  window.Zotero.uRead.Plugin.zoteroupdatetranslator = function () { plugin.zoteroupdatetranslator() }
  window.Zotero.uRead.Plugin.ureadupdatetranslator = function () { plugin.ureadupdatetranslator() }
  window.Zotero.uRead.Plugin.resettranslator = function () { plugin.resettranslator() }
} else {
  Zotero.debug('uRead@window is null.')
}

if (typeof module !== 'undefined') module.exports = plugin
