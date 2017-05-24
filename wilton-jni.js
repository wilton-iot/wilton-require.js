/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var WILTON_JNI = true;

function WILTON_wiltoncall(name, data) {
    var res = Packages.net.wiltonwebtoolkit.WiltonJni.wiltoncall(name, data);
    return null !== res ? String(res) : null;
}

WILTON_load(WILTON_REQUIREJS_DIRECTORY + "wilton-require.js");
