/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function print(msg) {
    Packages.java.lang.System.out.println(msg);
}

function WILTON_wiltoncall(name, data) {
    var res = Packages.net.wiltontoolkit.WiltonJni.wiltoncall(name, data);
    return null !== res ? String(res) : null;
}

// Nashorn Array.splice fix
// https://bugs.openjdk.java.net/browse/JDK-8068972
WILTON_Array_prototype_splice_orig = Array.prototype.splice;
Array.prototype.splice = function() {
    "use strict";
    
    if (1 === arguments.length) {
        var args = Array.prototype.slice.call(arguments);
        args.push(this.length - args[0]);
        return WILTON_Array_prototype_splice_orig.apply(this, args);
    }
    return WILTON_Array_prototype_splice_orig.apply(this, arguments);
};

// Rhino Object.keys fix
// "new String(...)" is not iterable with "for key in .." in Rhino
WILTON_Object_keys_orig = Object.keys;
Object.keys = function(obj) {
    "use strict";
    
    if ("object" === typeof (obj) && obj instanceof String) {
        var res = WILTON_Object_keys_orig(obj);
        if (res.length !== obj.length) {
            res = [];
            for (var i = 0; i < obj.length; i++) {
                res.push(String(i));
            }
        }
        return res;
    }
    return WILTON_Object_keys_orig(obj);
};
