fluid.defaults("adam.pushquencer", {
    gradeNames: ["adam.sequencer", "adam.pushgridmapper"],
    model: {
        bpm: 97,
        /// todo modelize payloads?
        payload: {"func": "trig", "args": 1000},
        midipayload: {"func": "send", "args" : {type: "noteOn", channel: 9, note: 36, velocity: 100}},
        selectedpayload: undefined,
        selectedtarget: undefined,
    },
    invokers: {
        poppy: {
            funcName: "adam.pushquencer.popSequence",
            args: "{that}"
        }
    },
    components: {
        //ES9midiout: {},
        //EIEmidiout: {},
        //flockingtimedgate
        midiout: {
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
        ticksynth: {
            type: "adam.ticksynth"
        }
    },
    listeners: {
        onCreate: {
            func : function(that){
                that.push.model.tempoKnob = that.model.bpm;
                that.model.selectedpayload = that.model.midipayload;
                that.model.selectedtarget = that.midiout;
            },
            args: "{that}"
        },
        /*
        onReady: {
            func: function(that){
            },
            args: "{that}"
        },
        */
        "{that}.events.beat": {
            func: console.log,
            args: "{arguments}.0"
        },
        "{push}.events.tempoKnob": {
            funcName: "{that}.setTempo",
            args: "{push}.model.tempoKnob"
        },
        /*
        "{push}.events.tempoKnob": {
            func: console.log,
            args: "{push}.model.tempoKnob"
        },
        */
        "{push}.events.buttonPlayPressed": {
            funcName: "{that}.play",
        },
        "{push}.events.buttonPressed": {
            funcName: "adam.pushquencer.buttonHandler",
            args: [ "{that}", "{arguments}.0" ]
        },
        "{that}.events.regionCreated": {
            priority: "first",
            funcName: "adam.pushquencer.regionToSequence",
            args: ["{that}", "{arguments}.0"]
        },
        "{that}.events.overlapFound": {
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

                    //if( testTwoObjects( locationfirstcell, 

                    // select all the first beats to do something
                    return;
                }else {
                    // todo check this amendment doesn't overlap with an existing seq/
                    let foundseq = that.thegrid.getcell( cellz[0].location );
                    let overlappingstep = foundseq.getStepFromLocation ( cellz[0].location ) ;
                    
                    if ( !foundseq.isStepOnBeat( overlappingstep )){
                        console.log( ' step not ok beat, exiting ' );
                        return;
                    }

                    let newseq = adam.sequence();
                    for ( let cell of cellz  ){
                        Object.assign( cell, that.model.midipayload );
                        /// todo get payload from step and put it in the revision
                    }
                    newseq.arraytosequence(cellz);
                    newseq.settarget( that.midiout );

                    //console.log( foundseq.getStepBeat( overlappingstep ) );
                    //console.log( overlappingstep ) ;

                    let somebeat = foundseq.getStepBeat( overlappingstep  ) ;
                    let removedsteps = foundseq.reviseBeat( newseq, somebeat );

                    for ( let step of removedsteps ){
                        that.sequencergrid.removecell( step.location );
                    }
                    for (let cell of cellz){
                        that.sequencergrid.addcell( cell.location, 1 );
                    }
                    that.sequencergrid.events.gridChanged.fire();

                }
            },
            args: [ "{that}", "{arguments}.0" ]
        },
        "{that}.events.selectcell": {
            func: function(that){
                console.log( that.thegrid.getcell ( that.sequencergrid.model.selectedcell ) );

                // todo put the payload on the knobs

            },
            args: "{that}"
        }
    },
    /*
    modelListeners: {
        "{sequencergrid}.model.selectedcell": { // not firing, why?
            func: console.log,
            args: "{that}.model.selectedcell"
        }
    }
    */
});

adam.pushquencer.regionToSequence = function(that, stepz){

    var thepayload = fluid.copy( that.model.selectedpayload);

    // todo move this to a post action?
    that.model.midipayload.args.note++;

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
    s.arraytosequence(stepz);
    s.settarget( that.model.selectedtarget );
    s.model.loop = true;

    // todo finish here and create different funtions for new or revising

    if( that.addsequence(s) ){ // check for overlap
        that.selectsequence(s);

        console.log('successful add');

        //// todo fix this  ->  create function that maps the sequencergrid to the ableton grid
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
};

/*
adam.pushquencer.addlights = function (that, seq ){
    if( that.addsequence(s) ){ // check for overlap
        that.selectsequence(s);

        console.log('successful add');

        //// todo fix this  ->  create function that maps the sequencergrid to the ableton grid
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
};
*/

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
    if ( button === 118 ){
        adam.pushquencer.popSequence( that );
        return;
    }

    console.log( button );
}
