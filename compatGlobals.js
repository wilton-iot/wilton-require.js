
define([], function() {
    
    global = {console: console};
    process = {
        env: {},
        stdout: {
            write: console.log,
            on: function() {},
            once: function() {},
            emit: function() {}
        }
    };
    amd = true;
    setImmediate = function(fun, arg) { fun(arg);};

    return null;
});

