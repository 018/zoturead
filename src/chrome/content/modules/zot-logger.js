if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Logger) Zotero.ZotURead.Logger = {};

Zotero.ZotURead.Logger = Object.assign(Zotero.ZotURead.Logger, {
	init() {
    this.log('Zotero.ZotURead.Logger inited.');
  },

  // zoturead@zotero.org(3.0.1) zoturead.js:23: 

  isDebug() {
    return typeof Zotero !== 'undefined' && typeof Zotero.Debug !== 'undefined' && Zotero.Debug.enabled;
  },
  
  log(message) {
    if (this.isDebug()) {
      if (Zotero.ZotURead.Objects.isUndefined(message)) {
        this.debug('undefined');
      } else if (Zotero.ZotURead.Objects.isNull(message)) {
        this.debug('null');
      } else if (Zotero.ZotURead.Objects.isEmptyString(message)) {
        this.debug('');
      } else if (Zotero.ZotURead.Objects.isObject(message)) {
        this.debug(this._stringifyJSON(message));
      } else if (Zotero.ZotURead.Objects.isArray(message)) {
        this.debug('[' + message.join(', ') + ']');
      } else {
        this.debug(message);
      }
    }
  },
  
  trace(name, value) {
    if (this.isDebug()) {
      if (Zotero.ZotURead.Objects.isUndefined(value)) {
        this.debug(`${name} >>> undefined`);
      } else if (Zotero.ZotURead.Objects.isNull(value)) {
        this.debug(`${name} >>> null`);
      } else if (Zotero.ZotURead.Objects.isEmptyString(value)) {
        this.debug(`${name} >>> ""`);
      } else if (Zotero.ZotURead.Objects.isObject(value)) {
        this.debug(`${name} >>> ` + this._stringifyJSON(value));
      } else if (Zotero.ZotURead.Objects.isArray(value)) {
        this.debug(`${name} >>> [` + value.join(', ') + ']');
      } else {
        this.debug(`${name} >>> ${value}`);
      }
    }
  },
  

  error(err) {
    if (Zotero.ZotURead.Objects.isObject(err)) {
      Zotero.logError(`${this._outPrefix()} ${filename}:${line}@${method}: ` + JSON.stringify(err));
    } else if (Zotero.ZotURead.Objects.isArray(err)) {
      Zotero.logError(`${this._outPrefix()} ${filename}:${line}@${method}: ` + '[' + err.join(', ') + ']');
    } else {
      Zotero.logError(err);
    }
  },

  debug(message) {
    var {method, filename, line} = this.getStack();
    Zotero.debug(`${this._outPrefix()} ${filename}:${line}@${method}: ${message}`);
  },

  ding() {
    var {method, filename, line} = this.getStack();
    Zotero.debug(`${this._outPrefix()} ${filename}:${line}@${method} ${Zotero.isMac ? '📌' : '!'}`);
  },

  stack() {
    var array = new Error().stack.split('\n');
    var lines = '';
    var method, filename, line;
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (!filename || filename == 'zot-logger.js' || filename == 'zot-render-element-plus.js') {
        filename = this._parseRegExpGroup(/.*\/(.*?js)\:.*$/, element);
        if (filename === 'zot-logger.js' || filename == 'zot-render-element-plus.js') {
          continue;
        }
      }
      
      if (!method) {
        method = this._parseRegExpGroup(/^(.*?)@.*$/, element);
        line = this._parseRegExpGroup(/(\d*)\:\d*$/, element);
      }
      lines += '  ' + element + '\n';
    }

    Zotero.debug(`${this._outPrefix()} ${filename}:${line}@${method}: \n${lines}`);
  },

  _stringifyJSON(value) {
    return JSON.stringify(value, null, 2).split('\n').map((e, i)=>i > 0 ? '  ' + e : e).join('\n');
  },

  getStack() {
    var array = new Error().stack.split('\n');
    var method, filename, line;
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (element.includes('chrome://zotero/content/runJS.js')) {
        filename = 'runJS.js';
        method = '@';
        line = this._parseRegExpGroup(/(\d*)\:\d*$/, element);
        return {method, filename, line};
      }
      filename = this._parseRegExpGroup(/.*\/(.*?js)\:.*$/, element);

      if (filename === 'zot-logger.js' || filename == 'zot-render-element-plus.js') {
        continue;
      }

      method = this._parseRegExpGroup(/^(.*?)@.*$/, element);
      line = this._parseRegExpGroup(/(\d*)\:\d*$/, element);
      return {method, filename, line};
    }
  },

  _parseRegExpGroup(reg, str) {
    var ret = reg.exec(str);
    if (ret && str.length > 1) {
      return ret[1];
    } else {
      Zotero.debug(`${this._outPrefix()}: ${reg}, ${str}, ${ret}`);
    }
  },

  _outPrefix() {
    let now = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    return `${Zotero.isMac ? '🤪' : '^-^'}${now} - ${Zotero.ZotURead.Selfs.id}(${Zotero.ZotURead.Selfs.version})`;
  },
});