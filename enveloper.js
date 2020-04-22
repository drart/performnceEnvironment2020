fluid.defaults('adam.enveloper', {
    gradeNames: 'fluid.modelComponent',
    model: {
        envelope: {
            levels: [],
            times: [],
            curve: []
        },
        loop: false,
        looptimer : null,
    },
    invokers: {
        envrange: {
            func: function(that, low, high){
                //that.set("env.mul", high - low);
                //thhat.set("env.add", low);
                that.model.mul = high - low;
                that.model.add = low;
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"] 
        },
        createenv:{
            func: function(that, args){
                let envobj = args;
                if (args instanceof Array){
                   envobj = {};
                   envobj.levels = [];
                   envobj.times= [];
                   envobj.curve= [];
                   for(var i = 0; i <  args.length; i++){
                       envobj.levels[i] = args[i];
                       if (i !== args.length - 1){
                           envobj.times[i] = 1;
                           envobj.curve[i] = "linear";
                       }
                   } 
                };
               that.model.envelope = envobj; 
               return that.model.envelope;
            },
            args: ["{that}", "{arguments}.0"]
        },
        triggerenvelope: {
            func: function(that, address){
                var myfunc = function(that){
                    that.set("env.gate", 0);
                    that.set("env.gate", 1);
                };
                if(that.model.loop){
                    var theenv = that.getenvelope();
                    var envduration = 0;
                    for(var i = 0; i < that.getenvelope().times.length; i++){
                        envduration += theenv.times[i];
                    }
                    that.options.looptimer = settimeout(myfunc, envduration);
                }else{
                    myfunc(); 
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        getsteplevel: {
            func: function(that, step){
                return that.getenvelope().levels[step];
            },
            args: ["{that}", "{arguments}.0"]
        },
        /// the curve between step and the next
        getintervalurve: { 
            func: function(that, step){
                return that.getenvelope().curve[step];
            },
            args: ["{that}", "{arguments}.0"]
        },
        getsteplength: {
            func: function(that){
                return that.get("env.envelope").levels.length;
            },
            args: ["{that}"]
        },
        isenvelope: {
            func: function(that, address){
                return ( that.get(address).ugen === "envGen" ) ? true : false;
            },
            args: ["{that}", "{arguments}.0"]
        },
        getenvelope: {
            func: function(that){return that.model.envelope},
            args: ["{that}"]
        },
        addstep:{
            func: function(that, level, time, curve){
                var theenv = that.getenvelope();

                if (theenv.levels.length < 2){
                    console.log('oops');
                };

                theenv.levels.push(level);
                var thetime = (time === undefined)? 1 : time;
                var thecurve = (curve === undefined)? 'linear' : curve;
                theenv.times.push(thetime);
                theenv.curve.push(thecurve);

                //that.set("env.envelope", theenv);
            },
            args: ["{that}", "{arguments}.0","{arguments}.1","{arguments}.2"] 
        },
    }
});
