fluid.defaults("adam.pushquencer", {
    gradeNames: ["adam.sequencer", "adam.pushgridmapper"],
    model: {
        bpm: 97,
    },
    events: {},
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
        "{sequencergrid}.events.gridChanged": {
            func: "adam.pushquencer.gridChanged",
            args: ["{that}", "{arguments}.0"]
        }
    },
});

adam.pushquencer.gridChanged = function(that, stepz){

    let s = adam.sequence();
    s.model.loop = true;
    // todo figure this out
    //s.settarget();
    s.arraytosequence(stepz);

    if(that.addsequence(s)){
        that.selectsequence(s);
    }
};
