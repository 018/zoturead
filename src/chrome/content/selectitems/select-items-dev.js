const { createApp, ref, reactive, toRaw, computed, nextTick } = Vue;
const { ElMessageBox, ElLoading } = ElementPlus;

window.onload = async function () {

  ZotElementPlus.createElementPlusApp({
    setup() {
      const items = reactive([{
        id: 1,
        label: '111',
        name: '111',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }, {
        id: 2,
        label: '222',
        name: '222',
        checked: true
      }]);

      return {
        items,
      }
    }
  });
}
