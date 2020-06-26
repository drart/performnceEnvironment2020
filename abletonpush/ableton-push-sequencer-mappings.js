fluid.defaults("adam.pushquencer", {
    gradeNames: ["adam.sequencer", "adam.pushgridmapper"],
    model: {
        bpm: 97,
        payload: {"func": "trig", "args": 1000},
        midipayload: {"func": "send", "args" : {type: "noteOn", channel: 9, note: 39, velocity: 100}},
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
        midiout: {
            type: "flock.midi.connection",
            options: {
                openImmediately: true,
                ports: {
                    output: {
                        name: "EIE"
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
        "{push}.events.tempoKnob": {
            funcName: "{that}.setTempo",
            args: "{push}.model.tempoKnob"
        },
        "{push}.events.buttonPlayPressed": {
            funcName: "{that}.play",
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
                }else {
                    /// todo check if first beat 
                    let newseq = adam.sequence();
                    for ( let cell of cellz  ){
                        Object.assign( cell, that.model.midipayload );
                        /// todo get payload from step and put it in the revision
                    }
                    newseq.arraytosequence(cellz);
                    newseq.settarget( that.midiout );

                    let foundseq = that.thegrid.getcell( cellz[0].location );
                    let overlappingstep = foundseq.getStepFromLocation ( cellz[0].location ) ;

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

    for (let row of stepz){ 
        if (row.length !== undefined){
            for (let column of row){
                //Object.assign(column, that.model.payload);
                Object.assign(column, that.model.midipayload);
            }
        }else{
            //Object.assign(row, that.model.payload);
            Object.assign(row, that.model.midipayload);
        }
    }

    let s = adam.sequence();
    s.arraytosequence(stepz);
    //s.settarget( that.ticksynth );
    s.settarget( that.midiout );
    s.model.loop = true;

    // todo finish here and create different funtions for new or revising

    if( that.addsequence(s) ){ // check for overlap
        that.selectsequence(s);

        console.log('successful add');

        //// todo fix this  ->  create function that maps the sequencergrid to the ableton grid
        ///that.sequencergrid.applier.change("grid", stepz);

        for ( let step of stepz ){
            if ( step.length !== undefined ){
                for ( let substep of step ){
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
