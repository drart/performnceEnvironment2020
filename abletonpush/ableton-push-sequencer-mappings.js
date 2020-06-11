fluid.defaults("adam.pushquencer", {
    gradeNames: ["adam.sequencer", "adam.pushgridmapper"],
    model: {
        bpm: 97,
        payload: {"func": "trig", "args": 1000},
    },
    events: {},
    components: {
        midiout: {
            type: "flock.midi.connection"
        },
        ticksynth: {
            type: "adam.ticksynth"
        }
    },
    listeners: {
        onCreate: {
            func : function(that){
                that.push.model.tempoKnob = that.model.bpm;
            },
            args: "{that}"
        },
        "{push}.events.tempoKnob": {
            funcName: "{that}.setTempo",
            args: "{push}.model.tempoKnob"
        },
        "{that}.events.regionCreated": {
            priority: "first",
            func: "adam.pushquencer.regionToSequence",
            args: ["{that}", "{arguments}.0"]
        }
    },
});

adam.pushquencer.regionToSequence = function(that, stepz){

    let firstcell = stepz[0];
    for (let row of stepz){ 
        if (row.length !== undefined){
            firstcell = stepz[0][0];
            for (let column of row){
                Object.assign(column, that.model.payload);
            }
        }else{
            Object.assign(row, that.model.payload);
        }
    }

    let s = adam.sequence();
    s.arraytosequence(stepz);
    s.settarget( that.ticksynth );
    s.model.loop = true;

    if( that.addsequence(s) ){ // check for overlap
        that.selectsequence(s);
        //// todo fix this 
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
        //that.overlappedCell(s);
        console.log('something went wrong adding a sequence');
    }
};
