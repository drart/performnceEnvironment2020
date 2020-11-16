// TODO
// modelize the knobs? val, min, max, inc, stringprepend, stringappend -> pair with the screen?
//
fluid.defaults("adam.midi.push", {
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
    model : {
        lcdline1: ' '.padEnd(68, ' '),
        lcdline2: ' '.padEnd(68, ' '),
        lcdline3: 'Made by Ableton'.padStart(41, ' ').padEnd(68, ' '),
        lcdline4: 'Powered by Flocking.js'.padStart(45, ' ').padEnd(68, ' '),
        //knobs: [],
        /*
        knob2: { // is this better?
            min: 0,
            max: 100,
            value: 50,
            increment: 1
        },
        */
        knob1: 100, 
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
        padColours: {
            off: 0,
            selected: 1,
            highlighted: 30
        },
        buttons: {
            quarter: 19,
            quartertriplet: 1,
            eighthtriplet: 1,
            eighth: 1,
            sixteenth: 1,
            sixteenthtriplet: 1,
            thirtysecond: 1,
            thitysecondtriplet: 1,
            left: 1, 
            right: 1, 
            down: 1, 
            up: 1,
            newbutton: 1,
            deletebutton: 1, 
            automation: 1,
            note: 1, 
            session: 1
        }
    },
    components: {
        padGrid : {
            type: "adam.grid"
        }
    },
    modelListeners: {
        // wait until midi initializes?
        lcdline1: { 
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
        },
        buttons: {
            funcName: "adam.midi.push.buttonWrite",
            args: ["{that}", "{change}.value", "{change}.oldvalue" ]
        },
        "{that}.padGrid.model.grid": {
            func: "adam.midi.push.gridUpdate",
            args: ["{that}", "{change}.value", "{change}.oldValue"] /// "{change}.oldValue"
        }
    },
    events: {
        knobTouched: null,
        knobReleased: null,
        padPushed: null,
        padReleased: null,
        pedal1: null,
        pedal2: null,
        knob1: null,
        knob2: null,
        knob3: null,
        knob4: null,
        knob5: null,
        knob6: null, 
        knob7: null,
        knob8: null,
        tempoKnob: null,
        swingKnob: null,
        volumeKnob: null,
        buttonPlayPressed: null,
        buttonPlayReleased: null,
        buttonPressed: null, 
        buttonReleased: null
    },
    invokers: {
        // LCD Handlers
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
        lcdRefresh: {
            funcName: "adam.midi.push.lcdRefresh",
            args: "{that}"
        },
        // Pad and button handlers
        padWrite: {
            funcName: "adam.midi.push.padWrite",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        padClearAll: {
            funcName: "adam.midi.push.padClearAll",
            args: ["{that}"]
        },
        /*
        padSet: {
            funcName: "adam.midi.push.gridUpdate",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        buttonWrite: {
            funcName: "adam.midi.push.buttonWrite",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        */
    },
    listeners : {
        onReady: { 
            func: function(that){
                    that.lcdRefresh();
                    that.padClearAll();
            },
            args: ["{that}"]
        },
        noteOn : {
            funcName: "adam.midi.push.noteToEvents",
            args: ["{that}", "{arguments}.0"]
        },
        noteOff: {
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
    console.log(thestring);
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


adam.midi.push.lcdRefresh = function (that){
    that.lcdWrite( that.model.lcdline1, 0);
    that.lcdWrite( that.model.lcdline2, 1);
    that.lcdWrite( that.model.lcdline3, 2);
    that.lcdWrite( that.model.lcdline4, 3);
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

adam.midi.push.padClearAll = function(that){
    for( let x = 0; x < 8; x++){
        for( let y = 0; y < 8; y++){
            that.padWrite(x, y, 0);
        }
    }
};

/// todo make this more useable
adam.midi.push.gridUpdate = function(that, newgrid, oldgrid){
    console.log('gridupdate');
    console.log(newgrid);
    console.log(oldgrid);
    /*

    for( let x = 0; x < 8; x++){
        for( let y = 0; y < 8; y++){
            if ( typeof oldgrid[i] === "object" && typeof newgrid[i] === "object"){
                if ( !testTwoObjects(oldgrid[i], newgrid[i])  ){
                    
                }
            }
        }
    }

     */
};

//adam.midi.push.padRefresh = function(that){};

///// TODO FIX THIS 
//    map button to the buttons in the midi 
/*
adam.midi.push.buttonWrite = function (that, button, colour = 1){
    var midimessage = {type: "control", channel: 0, number: button , value: colour}
    that.send(midimessage);
};
*/

adam.midi.push.buttonWrite = function (that, buttons, oldstate){
    console.log( that );
    console.log(buttons);
    console.log( oldstate );
    
    for ( let b in buttons ){
        console.log( buttons[b] );
    }
};

adam.midi.push.noteToEvents = function(that, msg){
    if (msg.note < 20){
        that.events.knobTouched.fire(msg); // unroll this to knob and value?
    }else{
        var notenumber = msg.note;
        var r = Math.floor((notenumber - 36) / 8);
        var c = (notenumber-36) % 8;
        var pos = { column : c, row: r };
        if( msg.velocity > 0){
            that.events.padPushed.fire( pos, msg.velocity );
        }else{
            that.events.padReleased.fire( pos, msg.velocity );
        }
    } 
};

adam.midi.push.knobsToString = function (that ){
    let knobstring = '';

    let knob1string = that.model.knob1.toString();
    knob1string = knob1string.padStart(8 , ' '); 
    let knob2string = that.model.knob2.toString();
    knob2string = knob2string.padStart(9 , ' '); 
    let knob3string = that.model.knob3.toString();
    knob3string = knob3string.padStart(8 , ' '); 
    let knob4string = that.model.knob4.toString();
    knob4string = knob4string.padStart(9 , ' '); 
    let knob5string = that.model.knob5.toString();
    knob5string = knob5string.padStart(8 , ' '); 
    let knob6string = that.model.knob6.toString();
    knob6string = knob6string.padStart(9 , ' '); 
    let knob7string = that.model.knob7.toString();
    knob7string = knob7string.padStart(8 , ' '); 
    let knob8string = that.model.knob8.toString();
    knob8string = knob8string.padStart(9 , ' '); 

    knobstring = knob1string + knob2string + knob3string + knob4string + knob5string + knob6string + knob7string + knob8string;
    that.applier.change('lcdline1', knobstring);
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
    //console.log(msg);
    if (msg.number === 85){
        if (msg.value === 127){
            that.events.buttonPlayPressed.fire();
        }else{
            that.events.buttonPlayReleased.fire();
        }
    }

    // todo finish the mappings here

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
