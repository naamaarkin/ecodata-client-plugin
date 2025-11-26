var CounterViewModel = function(options, context){
    var self = this;

    self.count = ko.observable(0);
    self.toJS = function(){
        return self.count();
    }
    self.toJSON = function(){
        return self.toJS();
    }
    self.increase = function(){
        self.count(Number(self.count())+1);
    }
    self.decrease = function(){
        var current = Number(self.count());
        if(self.count() > 0){
            self.count(current -1);
        }
    }
}