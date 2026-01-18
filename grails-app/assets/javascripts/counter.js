function CounterViewModel(options, context) {
    var count = ko.observable(0);

    // Optional: coerce numeric input
    count.subscribe(function(v){
        var n = Number(v);
        if (isNaN(n)) n = 0;
        // avoid infinite loop: only write back if different
        if (n !== v) count(n);
    });

    count.increase = function() {
        var current = Number(count()) || 0;
        count(current + 1);
    };

    count.decrease = function() {
        var current = Number(count()) || 0;
        if (current > 0) count(current - 1);
    };

    // For libraries that call toJS/toJSON on objects:
    count.toJS = function(){ return count(); };
    count.toJSON = function(){ return count(); };

    return count; // IMPORTANT
}