fluid.defaults("adam.pushquencer", {
    gradeNames: ["adam.sequencer", "adam.pushgridmapper"],
    model: {
        bpm: 97,
        /// todo modelize payloads?
        payload: {"func": "trig", "args": 1000},
        midipayload: {"func": "send", "args" : {type: "noteOn", channel: 9, note: 36, velocity: 100}},
        selectedpayload: undefined,
        selectedtarget: undefined,
        selectedsequence: undefined,
        deletemode: false,
        mode: 'tuple', // 'tuple' or 'cross'
    },

    invokers: {
        poppy: {
            funcName: "adam.pushquencer.popSequence",
            args: "{that}"
       },
       fouronthefloor: {
            funcName: "adam.pushquencer.fouronthefloordemo",
            args: "{that}"
       }
    },

    components: {
        ES9midiout: {
            type: "flock.midi.connection",
            options: {
                openImmediately: true,
                ports: {
                    output: {
                        name: "ES-9 MIDI Out"
                    }
                }
            }
        },
        mirack: {
            type: "flock.midi.connection",
            options: {
                openImmediately: true,
                ports: {
                    output: {
                        name: "miRack Input"
                    }
                }
            }
        },
        ticksynth: {
            type: "adam.ticksynth"
        },
        /*
        gatesynth: {
            type: "adam.gateout"
        }
        */
    },

    listeners: {
        "onCreate.setTempo": {
            funcName: "{that}.setTempo",
            args: "{that}.model.bpm"
        },
        "onCreate.setoutput":{
            func: function(that){
                that.model.selectedpayload = that.model.midipayload;
                that.model.selectedtarget = that.ES9midiout;
                //that.model.selectedpayload = that.model.payload;
                //that.model.selectedtarget = that.ticksynth;
                //that.model.selectedtarget = that.gatesynth;
            },
            args: "{that}"
        },
        "onCreate.setupKnobs": {
            func : function(that){
                that.push.model.tempoKnob.value = that.model.bpm;
                console.log( that.push.model.tempoKnob );
            },
            args: "{that}"
        },
        "{push}.events.onReady": {
            func: function(that){
                that.push.padClearAll();
                that.push.buttonClearAll();
                //that.push.lcdClearAll();
                that.push.lcdRefresh();
                that.push.applier.change("buttons.quartertuple", 126);
            },
            args: "{that}"
        },
        "{that}.events.beat": {
            func: function( beat ){$("#beat-display").html(beat)},
            args: "{arguments}.0"
        },
        "{push}.events.tempoKnob": {
            func: function( that, knobval ){ that.model.bpm += knobval; that.setTempo( that.model.bpm ); },
            args: ["{that}", "{arguments}.0"]
        },
        "{push}.events.knob1": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob2": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob3": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob4": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob5": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob6": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob7": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },
        "{push}.events.knob8": {
            funcName: "adam.pushquencer.knobsToPayload",
            args: ["{that}"]
        },

        "{push}.events.buttonPlayPressed": {
            funcName: "{that}.play",
        },
        "{push}.events.buttonPressed": {
            funcName: "adam.pushquencer.buttonHandler",
            args: [ "{that}", "{arguments}.0" ]
        },
        "{that}.events.regionCreated": {
            priority: "first",
            nameSpace: "jfjkdkfjkd",
            funcName: "adam.pushquencer.regionToSequence",
            args: ["{that}", "{arguments}.0"]
        },
        /*
         todo. 
        "{that}.events.regionCreated": {
            nameSpace: "incrememtargs",
            //funcName: "adam.pushquencer.regionToSequence",
            //args: ["{that}", "{arguments}.0"]
            func: console.log
        },
        */


        "{that}.events.overlapFound": {
            //priority: "last",
            func: function( that, cellz ){
                
                if ( Array.isArray( cellz[0] ) ){
                    console.log( ' multibeat selection not yet supported ' );
                    let rows = cellz.length;
                    let columns = cellz[rows-1].length;
                    let locationlastcell = cellz[rows-1][columns-1].location;

                    // select first and last cell to remove it? 
                    let locationfirstcell = cellz[0][0].location;
                    console.log(locationfirstcell);
                    console.log(locationlastcell);

                    // select all the first beats to do something
                    return;
                }else {

                    let foundseq = that.thegrid.getcell( cellz[0].location );
                    let overlappingstep = foundseq.getStepFromLocation ( cellz[0].location ) ;
                    
                    if ( !foundseq.isStepOnBeat( overlappingstep )){
                        console.log( ' step not on beat, exiting ' );
                        return;
                    }

                    let newseq = adam.sequence();
                    //let payload = foundseq.getlocationpayload( overlappingstep.location );
                    for ( let cell of cellz  ){
                        let newstep = fluid.copy(overlappingstep);
                        newstep.location = cell.location;
                        Object.assign( cell, newstep);
                    }
                    //console.log('after');
                    //console.log(cellz);
                    newseq.arraytosequence(cellz);
                    //newseq.settarget( that.model.target );

                    //console.log( foundseq.getStepBeat( overlappingstep ) );
                    //console.log( overlappingstep ) ;

                    let overlappingbeat = foundseq.getStepBeat( overlappingstep  ) ;
                    let removedsteps = foundseq.reviseBeat( newseq, overlappingbeat);

                    for ( let step of removedsteps ){
                        that.sequencergrid.removecell( step.location );
                        that.thegrid.removecell( step.location );
                    }
                    for (let cell of cellz){
                        that.sequencergrid.addcell( cell.location, 1 );
                        that.thegrid.addcell( cell.location, foundseq );
                    }
                    that.sequencergrid.events.gridChanged.fire();

                }
            },
            args: [ "{that}", "{arguments}.0" ]
        },
        "{that}.events.selectcell": {
            func: function(that, pos){
                that.sequencergrid.applier.change("selectedcell", pos); // todo do I need this here? 
                console.log(pos);

                let seq = that.thegrid.getcell ( pos ); // todo bug doesn't work for ammended sequences.
                let payload = seq.getlocationpayload( pos );

                // format the lcd
                if ( typeof payload  === "number" ){
                    console.log("it's a number");
                    that.push.applier.change('lcdline1', payload); 
                    that.push.applier.change('lcdline2', '');
                }
                if ( typeof payload === "object" ){

                    Object.keys( payload ).forEach(function(key, i){
                        that.push.applier.change('knob' + (i + 1) + ".name", key ); 
                        that.push.applier.change('knob' + (i + 1) + ".value", payload[key]); 
                    });
                    
                    adam.pushquencer.payloadToLCD( that, payload );
                }

                //return payload; // todo future use
                
            },
            args: ["{that}", "{arguments}.0"]
        }
    },

    modelListeners: {
        "{sequencergrid}.model.selectedcell": { 
            func: console.log,
            args: "selectedcell"
        },
        "{push}.model.knob1.value": {
            func: console.log,
        }
    }
});

adam.pushquencer.regionToSequence = function(that, stepz){

    var thepayload = fluid.copy( that.model.selectedpayload);

    console.log(stepz);

    for (let row of stepz){ 
        if (row.length !== undefined){
            for (let column of row){
                Object.assign(column, fluid.copy(thepayload));
            }
        }else{
            //Object.assign(row, that.model.payload);
            Object.assign(row, fluid.copy(thepayload));
        }
    }

    let s = adam.sequence();

    // todo add more options for beatlengths
    if( that.model.mode === 'cross'  ){
        console.log(that.model.mode);
        let numberofnotes;
        if (stepz[0].length === undefined){
            s.model.beatlength = stepz.length;      
        }else{
            s.model.beatlength = stepz[0].length;      
        }
        s.model.beatlength *= 120;
    }
    //console.log(s.model.beatlength);

    s.arraytosequence( stepz );
    s.settarget( that.model.selectedtarget );
    s.model.loop = true;

    // todo finish here and create different funtions for new or revising

    if( that.addsequence(s) ){ // check for overlap

        console.log('successful add');

        //// todo fix this  ->  create function that maps the sequencergrid to the push grid
        ///that.sequencergrid.applier.change("grid", stepz);

        for ( let step of stepz ){
            if ( step.length !== undefined ){
                for ( let substep of step ){ /// for multibeat sequences
                    that.sequencergrid.addcell( substep.location, 1 );
                }
            }else{
                that.sequencergrid.addcell( step.location, 1 );
            }
        }
        that.sequencergrid.events.gridChanged.fire(); 
    }else{
        console.log('something went wrong adding a sequence');
    }

    // todo move this to a post action?
    //that.model.midipayload.args.note++;
};

adam.pushquencer.removeSequence = function(that, removedseq){
    if (removedseq === undefined ){ // todo is there a way to check fluid types?
        console.log (' error. sequence needed to be removed' );
        return;
    }
    for ( key in removedseq.model.steps ){
        let step = removedseq.model.steps[key];
        that.sequencergrid.removecell( step.location );
    } 
    that.sequencergrid.events.gridChanged.fire();
}

adam.pushquencer.popSequence = function(that){
    let removedsequence = that.popsequence();
    if (removedsequence === undefined){
        console.log('trying to pop sequence from empty sequencer');
        return;
    }
    for (key in removedsequence.model.steps){
        let step = removedsequence.model.steps[key];
        that.sequencergrid.removecell( step.location );
    }
    that.sequencergrid.events.gridChanged.fire();
}

adam.pushquencer.buttonHandler = function (that, button){
    if ( button === 119){
        adam.pushquencer.popSequence( that );
        return;
    }
    if ( button === 118 ){
        // todo 
        // check if delete mode  then set or unset
        that.model.deletemode = !that.model.deletemode;
        that.push.applier.change("buttons.deletebutton", 127);
        return;
    }
    if ( button === 36 ){
        that.model.mode = 'cross';
        that.push.applier.change("buttons.quarter", 127);
        that.push.applier.change("buttons.quartertuple", 1);
        return; 
    }
    if ( button === 37 ){
        that.model.mode = 'tuple';
        that.push.applier.change("buttons.quarter", 1);
        that.push.applier.change("buttons.quartertuple", 127);
        return; 
    }
    if ( button === 111 ){
        that.sequencergrid.model.selectedcell = null;
        adam.pushquencer.knobsToPayload(that);
        return;
    }
    if ( button === 110 ){
        // if target is midi then gate otherwise opposite
        that.model.selectedtarget = that.gatesynth;
        that.model.selectedpayload = that.model.payload;
        if (that.model.selectedtarget === that.gatesynth){
            console.log('alkjflkjdaf');
        }
        return; 
    }
    if (button === 46){
        that.model.midipayload.args.note++;
        return;
    }
    if (button === 47){
        that.model.midipayload.args.note--;
        return;
    }


    console.log( button );
}

// fires when all knobs move
adam.pushquencer.knobsToPayload = function(that){

    let seq, payload;
    if (that.sequencergrid.model.selectedcell !== null){
        seq = that.thegrid.getcell ( that.sequencergrid.model.selectedcell );
        payload = seq.getlocationpayload( that.sequencergrid.model.selectedcell );
    }else{
        payload = that.model.selectedpayload.args;
    }

    Object.keys(payload).forEach(function(key, i){
        if (typeof payload[key] === "number"){
            payload[key] = that.push.model["knob"+(i+1)].value;
            console.log(that.push.model["knob"+(i+1)].value);
        }
    });

    adam.pushquencer.payloadToLCD(that, payload);
};

//  todo cleanup
adam.pushquencer.formatPayloadToLCDString = function( payload ){
    let strings = [];
    let knobstring = '';
    let currentknobstring = '';
    let valstring = '';

    let i = 0;
    for (let key in payload ){
        let currentknobstring = key.toString();
        currentknobstring = currentknobstring.substring(0, 7+i%2);
        currentknobstring = currentknobstring.padStart( 8 + i%2  , ' ');

        currentvalstring = payload[key].toString();;
        currentvalstring = currentvalstring.substring(0, 7+i%2);
        currentvalstring = currentvalstring.padStart( 8 + i%2  , ' ');

        valstring += currentvalstring;
        knobstring += currentknobstring;
        i++;
    }
    strings.push(valstring);
    strings.push(knobstring);

    return strings;
};

adam.pushquencer.payloadToLCD = function( that, payload ){

    let strings = adam.pushquencer.formatPayloadToLCDString( payload );

    that.push.applier.change('lcdline1', strings[0]); // todo too close together? 
    setTimeout( function(){
        that.push.applier.change('lcdline2', strings[1]);
    },
        10
    ); 
};

adam.pushquencer.fouronthefloordemo = function(that){

    var fouronthefloor = [];
    let kick= {func: "send", location: {row: 0, column: 0}, args:{type: "noteOn", channel: 9, note: 36, velocity: 100}};
    let snare = {func: "send", location: {row: 0, column: 0}, args:{type: "noteOn", channel: 9, note: 37, velocity: 100}};
    let hh = {func: "send", location: {row: 0, column: 0}, args:{type: "noteOn", channel: 9, note: 38, velocity: 100}};
    let nt = {func: "send", location: {row: 0, column: 0}, args:{type: "noteOn", channel: 9, note: 100, velocity: 0}};

    for (let i = 0; i < 4; i++){
        let steparray = [];
        for (let k = 0; k < 4; k++ ){
            let step;
            if ( k !== 0 ){
                step = fluid.copy( nt);
            }else{
                step = fluid.copy( nt );
            }

            step.location.row = i;
            step.location.column = k;
            steparray[k] = step;
        }
        fouronthefloor[i] = steparray;
    }
    that.events.regionCreated.fire(fouronthefloor);

};

