// TODO
// modelize the knobs? val, min, max, inc, stringprepend, stringappend -> pair with the screen?
//
fluid.defaults("adam.midi.push", {
    // ------------------
    // midi setup
    // ------------------
    gradeNames: ["flock.midi.connection", "fluid.modelComponent"],
    sysex: true,
    openImmediately: true,
    ports: {
        input: {
            name : "Ableton Push User Port"
        },
        output: {
            name : "Ableton Push User Port"
        }
    },
    // ------------------
    // infusion setup
    // ------------------
    model : {
        lcdline1: "",
        lcdline2: "",
        lcdline3: "          Made by Ableton",
        lcdline4: "          Powered by Flocking.js",
        //knobs: [],
        knob1: 100, // change this to an object in the future?
        /*
        knob2: { // is this better?
            min: 0,
            max: 100,
            val: 50,
            inc: 1
        },
        */
        knob2: 100,
        knob3: 100,
        knob4: 100,
        knob5: 100,
        knob6: 100,
        knob7: 100,
        knob8: 100,
        volumeKnob: 100,
        tempoKnob: 120,
        swingKnob: 100,
        pedal1inverse : false,
        pedal2inverse : false,
    },
    modelListeners: {
        lcdline1: { // wait until midi initializes?
            funcName: "adam.midi.push.lcdWrite",
            args : ["{that}", "{change}.value" , 0]
        },
        lcdline2: {
            funcName: "adam.midi.push.lcdWrite",
            args: ["{that}", "{change}.value" , 1]
        },
        lcdline3: {
            funcName: "adam.midi.push.lcdWrite",
            args: ["{that}", "{change}.value" , 2]
        },
        lcdline4: {
            funcName: "adam.midi.push.lcdWrite",
            args: ["{that}", "{change}.value" , 3]
        }
    },
    events: {
        knobTouched: null,
        knobReleased: null,
        padPushed: null,
        pedal1: null,
        pedal2: null,
    },
    invokers: {
        /*
         * LCD Handlers
         */
        lcdClearLine: {
            funcName: "adam.midi.push.lcdClearLine",
            args: ["{that}", "{arguments}.0"]
        },
        lcdClear: {
            funcName: "adam.midi.push.lcdClear",
            args: ["{that}"]
        },
        lcdWrite: {
            funcName: "adam.midi.push.lcdWrite",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        // Pad and button handlers
        padWrite: {
            funcName: "adam.midi.push.padWrite",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        buttonWrite: {
            funcName: "adam.midi.push.buttonWrite",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    },
    listeners : {
        onReady: { 
            func: function(that){
                    //that.clearLCD();
                    //that.writeLCD("Made by Ableton", 1, 27);
                    //that.writeLCD("Powered by Flocking.js", 2, 24);
                    //that.applier.change("lcdline1", "Made by Ableton"); 
                    //that.applier.change("lcdline2", "Powered by Flocking.js"); 
                    //that.applier.change("lcdline3", "Powered by Flocking.js"); 
                    //that.applier.change("lcdline4", "Powered by Flocking.js"); 
            },
            args: ["{that}"]
        },
        noteOn : {
            funcName: "adam.midi.push.noteToEvents",
            args: ["{that}", "{arguments}.0"]
        },
        control: {
            funcName:  "adam.midi.push.controlToEvents",
            args: ["{that}", "{arguments}.0"]
        },
        aftertouch: function(msg){},
        pitchbend: function(msg){}
    },
    //dynamicComponents: {},
});

// PUSH SYSEX Spec
// 240,71,127,21,<24+line(0-3)>,0,<Nchars+1>,<Offset>,<Chars>,247
// 240,71,127,21,25,0,13,4,"Hello World",247
adam.midi.push.lcdWrite = function(that, thestring="test", line = 0, offset = 0 ){
    var thestringinascii = []; 
    if(typeof thestring != "string"){
        thestring = thestring.toString();
    }
    for(var i = 0; i < thestring.length; i++){
        thestringinascii[i] = thestring.charCodeAt(i);
    }
    mysysexmessage = [240, 71, 127, 21];
    mysysexmessage.push(24 + line, 0);
    mysysexmessage.push(thestring.length + 1, offset);
    mysysexmessage.push(...thestringinascii);
    mysysexmessage.push(247);
    that.sendRaw( mysysexmessage );
    return(mysysexmessage);
};

adam.midi.push.lcdClearLine = function (that, l = 0){
    if (typeof l === "number" && l < 4 && l >= 0) 
        that.sendRaw([240,71,127,21,28+l,0,0,247]); 
};

adam.midi.push.lcdClear = function(that){
    that.lcdClearLine(0);
    that.lcdClearLine(1);
    that.lcdClearLine(2);
    that.lcdClearLine(3);
};

adam.midi.push.padWrite = function(that, x = 0, y = 0, colour = 1){
    var midimessage = {type: "noteOn", channel: 0, note: 36, velocity: colour}
    midimessage.note = ( x * 8 ) + y + 36;
    that.send(midimessage); 
};

///// TODO FIX THIS 
adam.midi.push.buttonWrite = function (that, button, action){
    var midimessage = {type: "noteOn", channel: 0, note: 10, velocity: colour}
    midimessage.note = button; // ?
    that.send(midimessage);
};

adam.midi.push.noteToEvents = function(that, msg){
    console.log(msg);
    if (msg.note < 20){
        that.events.knobTouched.fire(msg); // unroll this to knob and value?
    }else{
        var notenumber = msg.note;
        var row = Math.floor((notenumber - 36) / 8);
        var column = (notenumber-36) % 8;
        that.events.padPushed.fire( row, column, msg.velocity);
    } 
};

//// TODO Fix with temp value  => change applier?
adam.midi.push.controlToEvents = function(that, msg){
    if (msg.number > 70 && msg.number < 79){
        that.model["knob" + (msg.number-70)] += msg.value > 64 ? - (128-msg.value) : msg.value;
        that.model["knob" + (msg.number-70)] = adam.clamp( that.model["knob" + (msg.number-70)], 0, 100 );
        that.events["knob" + (msg.number-70)].fire();
    }
    if (msg.number === 79){
        that.model["volumeKnob"] += msg.value > 64 ? - (128-msg.value) : msg.value;
        that.model["volumeKnob"] = adam.clamp( that.model["volumeKnob"], 0, 100 );
        that.events.volumeKnob.fire();
    }
    if (msg.number === 14){
        that.model["swingKnob"] += msg.value > 64 ? - (128-msg.value) : msg.value;
        that.model["swingKnob"] = adam.clamp( that.model["swingKnob"], 0, 100 );
        that.events.swingKnob.fire();
    }
    if (msg.number === 15){
        that.model["tempoKnob"] += msg.value > 64 ? - (128-msg.value) : msg.value;
        that.model["tempoKnob"] = adam.clamp( that.model["tempoKnob"], 20, 200 );
        that.events.tempoKnob.fire();
    }
    
    if (msg.number === 64){
        var down = (that.model.pedal1inverse) ? 0 : 127 ;
        var up = (that.model.pedal1inverse) ? 127 : 0;
        if(msg.value === down ){
            that.events.pedal1.fire("down");
        }else{
            that.events.pedal1.fire("up");
        }
    }
    if (msg.number === 69){
        var down = (that.model.pedal2inverse) ? 0 : 127 ;
        var up = (that.model.pedal2inverse) ? 127 : 0;
        if (msg.value === down){
            that.events.pedal2.fire("down");
        }else{
            that.events.pedal2.fire("up");
        }
    }
}; 
    //adam.midi.push.aftertouchToEvents}



/////////////////////////////////////////////
//  Controller Utilities
/////////////////////////////////////////////
fluid.defaults("adam.midi.console", {
    listeners: {
        "noteOn.log": function(msg){
            console.log(msg);
        },
        "noteOff.log": function(msg){
            console.log(msg);
        },
        "control.log": function(msg){
            console.log(msg);
        },
        "aftertouch.log": function(msg){
            console.log(msg)
        },
        "pitchbend.log": function(msg){
            console.log(msg)
        }
    }
});

fluid.defaults("adam.midi.domlog", {
    model: {
        anchor: null,
        domElement: null
    },
    invokers: {
        creator: {
            funcName: "adam.midi.domlog.ready",
            args: ["{that}"]
        },
        printor: {
            func: function(that, msg){
                if(msg.type === "noteOn"){
                    $("#" + that.id + "-noteon").text(fluid.prettyPrintJSON(msg));
                }
                if(msg.type === "noteOff"){
                    $("#" + that.id + "-noteoff").text(fluid.prettyPrintJSON(msg));
                }
                if(msg.type === "control"){
                    $("#" + that.id + "-cc").text(fluid.prettyPrintJSON(msg));
                }
                if(msg.type === "aftertouch"){
                    $("#" + that.id + "-aftertouch").text(fluid.prettyPrintJSON(msg));
                }
                if(msg.type === "pitchbend"){
                    $("#" + that.id + "-pitchbend").text(fluid.prettyPrintJSON(msg));
                }
            },
            args: ["{that}", "{arguments}.0"]
        }
    },
    listeners: {
        "noteOn.domlog": "{that}.printor",
        "noteOff.domlog": "{that}.printor",
        "control.domlog": "{that}.printor",
        "aftertouch.domlog": "{that}.printor",
        "pitchbend.domlog": "{that}.printor",
        "onReady.preapredom": "{that}.creator",
    }
});

adam.midi.domlog.ready = function(that){
    if (document.getElementById("midi-display") === null){
        console.log("midi display dom element does not exist");
    }
    that.options.domElement = $("<div/>");
    that.options.domElement.text( that.options.model.portname );
    that.options.domElement.appendTo("#midi-display");
    $("<div/>").attr("id", that.id+"-label").text(that.options.ports.input.name).appendTo(that.options.domElement);
    $("<div/>").attr("id", that.id+"-noteon").appendTo(that.options.domElement);
    $("<div/>").attr("id", that.id+"-noteoff").appendTo(that.options.domElement);
    $("<div/>").attr("id", that.id+"-cc").appendTo(that.options.domElement);
    $("<div/>").attr("id", that.id+"-aftertouch").appendTo(that.options.domElement);
    $("<div/>").attr("id", that.id+"-pitchbend").appendTo(that.options.domElement);
};

