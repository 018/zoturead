
pref("extensions.zotero.zoturead.max_loaded_tabs", Services.sysinfo.getProperty("memsize") / 1024 / 1024 / 1024 <= 8 ? 3 : 5);