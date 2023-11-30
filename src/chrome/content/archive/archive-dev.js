const { createApp, ref, reactive, toRaw, computed, nextTick } = Vue;
const { ElMessageBox, ElLoading } = ElementPlus;

window.onload = async function () {

  ZotElementPlus.createElementPlusApp({
    setup() {
      const check = ref('move');

      return {
        check,
      }
    }
  });
}
