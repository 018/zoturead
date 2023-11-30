const { createApp, ref, reactive, toRaw, computed, nextTick } = Vue;
const { ElMessageBox, ElLoading } = ElementPlus;

var io = window.arguments && window.arguments.length > 0 ? window.arguments[0] : { dataIn: {items: [], desc: ''} }
if (!io.dataIn.items || io.dataIn.items.length === 0) {
  window.close;
  Zotero.ZotCard.Messages.error(undefined, 'The parameter io is incorrect.');
} else {
  io = Object.assign(io, { dataOut: false })
  Zotero.ZotURead.Logger.log(io);
  window.onload = async function () {
    const _l10n = new Localization(["zoturead.ftl"], true);
  
    ZotElementPlus.createElementPlusApp({
      setup() {
        const ZotUReadConsts = reactive(Zotero.ZotURead.Consts);
        const items = reactive(io.dataIn.items);
        const selectedIndex = ref(0);
        const desc = ref(io.dataIn.desc);
        const mode = ref('move');
  
        const _init = async () => {
          ZotElementPlus.Console.log('inited.');
        }
  
        function cancel() {
          io.dataOut = false;
          window.close();
        }
  
        function ok() {
          io.dataOut = {
            mode: mode.value,
            selectedIndex: selectedIndex.value
          };
          window.close();
        }
  
        _init();
  
        return {
          ZotUReadConsts,
          selectedIndex,
          items,
          desc,
          mode,
          cancel,
          ok
        }
      }
    });
  }
}
