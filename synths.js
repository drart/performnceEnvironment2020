
/*
 * TODO Spread parameters across the knobs with values and labels? 
*/

fluid.defaults("adam.ticksynth", {
    gradeNames: "flock.synth",
    model: {
        volume: 1,
    },
    modeListeners:{
        volume: {
            func: function(that){
                //console.log("model listened");// this dowsn't print? 
                that.set("osc.mul", that.model.volme);
            },
            args: ["{that}"]
            /*  // error: to understand
             func: "{that}.set",
             args: ["{change}.path", "{change}.value"]
             */
        }
    },
    synthDef: {
        id: "osc",
        ugen: "flock.ugen.impulse",
        freq: {
            ugen: "flock.ugen.xLine",
            start: 0,
            end: 0,
            duration: 1
        }, // mul: 0.5
        mul: "{that}.model.volume"
    },
    invokers: {
        volume: {
            func: function(that, vol = 1){
                that.set("osc.mul", vol);
            },
            args: ["{that}", "{arguments}.0"]
        },
        trig: {
            func: function(that){
                that.set({"osc.freq.start": 1000, "osc.freq.end": 0});
            },
            args: ["{that}"]
        },
    }, 
});

fluid.defaults("adam.sawsynth", {
    gradeNames: "flock.synth",
    synthDef:{
        id: "osc",
        ugen: "flock.ugen.sawOsc",
        freq: 1000,
        mul: {
            ugen: "flock.ugen.asr",
            id: "env",
            attack: 0.01,
            sustain: 0.5,
            release: 0.1
        }
    },
    invokers: {
        trig: {
            func: function(that, freq){
                that.set("osc.freq", freq);
                that.set("env.gate", 1);
                setTimeout(function(){that.set("env.gate", 0)}, 10);
            },
            args: ["{that}", "{arguments}.0"]
        }
    }
});
