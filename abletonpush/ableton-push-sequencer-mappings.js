fluid.defaults("adam.pushquencer", {
    gradeNames: ["adam.sequencer", "adam.pushgridmapper"],
    model: {
        bpm: 97,
        payload: {"func": "trig", "args": 1000},
        midipayload: {"func": "send", "args" : {type: "noteOn", channel: 9, note: 39, velocity: 100}},
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

