const { createApp, ref, reactive, toRaw, computed, nextTick } = Vue;
const { ElMessageBox, ElLoading } = ElementPlus;

var io = window.arguments && window.arguments.length > 0 ? window.arguments[0] : { dataIn: [] }

io = Object.assign(io, { dataOut: false })

Zotero.ZotURead.Logger.log(io);

window.onload = async function () {
  const _l10n = new Localization(["zoturead.ftl"], true);

  ZotElementPlus.createElementPlusApp({
    setup() {
      const ZotUReadConsts = reactive(Zotero.ZotURead.Consts);
      const items = reactive(io.dataIn);

      const _init = async () => {
        ZotElementPlus.Console.log('inited.');
      }

      function cancel() {
        window.close();
      }

      function ok() {
        var dataOut = []
        items.forEach(i => {
          if (i.checked) {
            dataOut.push(i);
          }
        });
        if (dataOut.length > 0) {
          io.dataOut = dataOut;
          window.close();
        }
      }

      function selectall() {
        items.forEach(i => {
          i.checked = true;
        });
      }

      function unselectall() {
        items.forEach(i => {
          i.checked = false;
        });
      }

      _init();

      return {
        ZotUReadConsts,
        items,
        cancel,
        ok,
        selectall,
        unselectall
      }
    }
  });
}