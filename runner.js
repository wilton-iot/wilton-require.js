
function runScript(callbackScriptJson) {
    try {
        var cs = JSON.parse(callbackScriptJson);
        if ("string" !== typeof(cs.module) || "string" !== typeof(cs.func) ||
                "undefined" === typeof (cs.args) || !(cs.args instanceof Array)) {
            throw new Error("Invalid 'callbackScriptJson' specified: [" + callbackScriptJson + "]");
        }
        var module;
        // expected to be always sync
        require([cs.module], function(mod) {
            module = mod;
        });
        // target call
        var res = module[cs.func].apply(module, cs.args);
        if ("undefined" == typeof(res) || null === res) {
            return "";
        }
        if ("string" !== typeof(res)) {
            return JSON.stringify(res);
        }
        return res;
    } catch(e) {
        throw new Error("JS call data: [" + callbackScriptJson + "]" + "\n" + e.stack);
    }
}
