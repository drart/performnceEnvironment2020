fluid.defaults("adam.sequence", {
    gradeNames: "fluid.modelComponent",
    model: {
        steps: {},
        beats: 1, // do I really need this? sequencelength?
        beatlength: 480,
        target: null, 
        mute: false,
        loop: false,
        sync: "tempo", // should a sequence start immediately or have a way of getting into sync?
        direction: "forward", // reverse, random, random-ish, nan
        playing: false,
        addingsequencetoselect: true,
        sequenceticks: 0,
        ticktime: 0, 
        //offset: 0,
        //currentstep: undefined,
        //previousstep: undefined,
        // steps are either change appliers for synth.set
        // or json {"func":"name", "args",[]} invoking the target
    },
    invokers: {
        settarget: {
            func: function(that, target){
                that.model.target = target;
            },
            args: ["{that}", "{arguments}.0"]
        },
        setstep: { // todo: this isn't used yet?
            func: function(that, step, payload){ // number of step, json object
                that.model.steps[step] = payload;
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        setlocationpayload:{
            func: function(that, loc, payload){
                if (loc === undefined || payload === undefined){
                    console.log("error: incomplete call to set payload");
                    return;
                }
                for( s in that.model.steps ){
                    console.log( that.model.steps[s] );
                    if ( that.model.steps[s].location.row === loc.row && that.model.steps[s].location.column === loc.column){
                        that.model.steps[s].args= payload;
                        console.log("bingo");
                        console.log(that.model.steps[s].args);
                    }
                }
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        getlocationpayload: {
            func: function( that, loc ){
                //console.log( that.getStepFromLocation( loc ) );
                let step = that.getStepFromLocation( loc );
                return step.args;
            },
            args: [ "{that}", "{arguments}.0"]
        },
        arraytosequence: {
            func: function(that, arr){
                let beatlength = that.model.beatlength;
                if (!Array.isArray(arr)){
                    console.log('warning: arrays must be used for sequences');
                    return -1;
                }

                // 480 is divisible by many divisions up to 20 without being too unwieldly for the clock
                if( Array.isArray(arr[0])){ // multibeat sequence
                    that.model.beats = arr.length;
                    for (var b = 0; b < arr.length; b++){
                        const steplength = Math.floor(beatlength / arr[b].length);
                        for (var i = 0; i < arr[b].length; i++){
                            //console.log( (steplength *i) + (beatlength * b));
                            that.model.steps[ (steplength * i) + (beatlength * b) ] = arr[b][i];
                        }
                    }
                }else{ // single beat sequence
                    const steplength = Math.floor(beatlength / arr.length);
                    for(var i = 0; i < arr.length; i++){
                        that.model.steps[steplength * i] = arr[i];
                    }
                }

                that.model.sequenceticks = that.model.beats * that.model.beatlength;
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        /*
           retrigger: function(){}, // placeholder
           applyoffset: function(){}, // placeholder
           reversesequence: { // todo :  finish
           func: function(that, seq){
           if (!seq){
           console.log('warning: no sequence available to reverse');
           return;
           };
           var keys = Object.keys(that.model.steps);
           for (var i = 0; i < Math.floor(keys.length/2); i++){
           var temp = that.model.steps[i];
           console.log(temp);
           }
           console.log(that.model.steps);
           },
           args: ["{that}"]
           },
           */
        clearsequence: {
            func: function(that){
                that.model.steps = {};
            },
            args: "{that}"
        },
        clearBeat: {
            func: function(that,  beat = 0){
                if (beat > that.model.beats - 1 ) beat = that.model.beats - 1;
                let removedbeats = [];
                for ( let key in that.model.steps ){
                    if ( key >= beat * 480 && key < (beat * 480) + 480){
                        removedbeats.push( that.model.steps[key] );
                        delete that.model.steps[key];
                    }
                }
                return removedbeats;
            },
            args: ["{that}", "{arguments}.0"]
        },
        getStepFromLocation: {
            func: function(that, loc ){
                let thestep
                for ( key in that.model.steps ){
                    if (testTwoObjects( that.model.steps[key].location, loc) ){
                        thestep =  that.model.steps[key];
                        break;
                    }
                }
                return thestep;
            },
            args: ["{that}", "{arguments}.0"]
        },
        isStepOnBeat: {
            func: function( that, step ){
                for (key in that.model.steps ){
                    if ( testTwoObjects( that.model.steps[key].location, step.location )){
                        if ( key % 480 === 0 ){
                            return true;
                        }else {
                            return false; 
                        }
                    }
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        getStepBeat: { /// steps need location, func, args
            func: function(that, step){
                for ( key in that.model.steps ) {
                    if ( testTwoObjects( that.model.steps[key], step )){
                        return parseInt(key) / 480 ;
                    } 
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        reviseBeat: {
            func: function(that, seq, beat = 0){ // multibeats?
                if (beat > that.model.beats - 1 ) beat = that.model.beats - 1;
                //// todo if seq.model.beatlength > 1 then clear multiple beats
                let removedsteps = that.clearBeat(beat);

                for ( let key in seq.model.steps ){
                    that.model.steps[ parseInt(key) + beat * 480 ] = seq.model.steps[key];
                }
                return removedsteps;
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        reviseNumberBeats: {
            func: function (that, seq, numberOfBeats=1){
                // todo  // add some more steps or remove steps
                return;
            },
            args: []
        }

    }
});

fluid.defaults("adam.sequencer",{
    gradeNames: ["flock.synth", "fluid.modelComponent"],

    model: {
        bpm: 60,
        beatlength: 480,
        ticktime: 0,
        sequences: [],
        selectedsequence: null,
        sequencestostart: [],
    },

    components: {
        thegrid: {
            type: "adam.grid",
        }
    },

    synthDef: {
        ugen: "flock.ugen.triggerCallback",
        trigger: {
            id: "pulse",
            ugen: "flock.ugen.impulse",
            freq: 480 // 240 
        },
        options: {
            callback: {
                func: function(that){
                    if (that.model.ticktime % that.model.beatlength === 0){
                        //console.log(that.model.ticktime);
                        that.events.beat.fire( that.model.ticktime / that.model.beatlength );                        
                    }
                    if (that.model.ticktime % that.model.beatlength === that.model.beatlength / 2 ) {
                        for ( let s of that.model.sequences){
                            if ( Object.keys(s.model.steps).length === 1 && s.model.playing === true){
                                that.push.padWrite( s.model.steps[0].location.row, s.model.steps[0].location.column );

                                // hack todo make a better solution
                                if (s.model.steps[0].args.type === "noteOn"){
                                    let noteOff = fluid.copy(s.model.steps[0].args);
                                    noteOff.type = "noteOff";
                                    s.model.target[s.model.steps[0].func](noteOff);
                                }
                                // end noteoff hack
                            }
                        }
                    }

                    for (let s of that.model.sequences){
                        
                        let thetick;
                        if (s.model.playing === true){

                            thetick = (s.model.loop === true) ? that.model.ticktime % s.model.sequenceticks: that.model.ticktime;
                        
                            if(s.model.mute === true){
                                s.model.ticktime++;
                                continue;
                            }
                            
                        }else{
                            continue;
                        }

                        /*
                        // TODO current step considering sequence direction
                        */

                        if ( s.model.steps[thetick] !== undefined ){
                            const payload = s.model.steps[thetick];
                            const target = s.model.target;

                            // todo if grid exisits then upadte it with payload location to be highlighted? 
                            // todo move the pad updates to a separate function
                            if(that.sequencergrid !== undefined){
                                that.push.padWrite( payload.location.row, payload.location.column, 30);
                                if (s.model.previousstep){
                                    that.push.padWrite( s.model.previousstep.location.row, s.model.previousstep.location.column );
                                }
                            }

                            if(payload.func){
                                target[payload.func](payload.args);
                            }else{
                                target.set(payload);
                            }
                            if ( Object.keys(s.model.steps).length > 1){
                                s.model.previousstep = s.model.steps[thetick];
                            }
                        }
                        s.model.ticktime++;
                    }
                    that.model.ticktime++;
                },
                args: ["{that}"]
            }
        }
    },

    events: {
        barline: null,
        resync: null,
        beat: null,
    },

    listeners: {
        "beat.turnSequencesOn": {
            func: function(that){
                for ( s in that.model.sequencestostart){
                    that.model.sequencestostart[s].model.playing = true; 
                }
                that.model.sequencestostart = [];
            },
            args: "{that}"
        }
    },

    invokers: {
        setTempo: {
            func: function(that, bpm){
                that.model.bpm = bpm;
                that.set("pulse.freq", that.model.bpm/60 * that.model.beatlength);
                console.log( bpm );
            },
            args: ["{that}", "{arguments}.0"]
        },
        getsequence: { 
            func: function(that, seq){
                let result = that.model.sequences.indexOf(seq);

                if( result !== -1 ){
                    result = that.model.sequences[ result ]; 
                    return result;
                }else{
                    return undefined;
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        addsequence: {
            func: function(that, seq){
                if(that.thegrid === null){
                    console.log('null grid');
                    return false;
                }
                /* this checking for overlap has been put into the grid mapping instead
                }else{
                    if ( that.thegrid.checkzoneoverlap( seq.model.steps ) ){

                        // get the overlapping sequence  // no logic for overlapping sequences
                        // set the selected cell to be the first overlapping cell
                        let keys = Object.keys(seq.model.steps);
                        let foundseq = null; 
                        for ( let key of keys ){
                            foundseq = that.thegrid.getcell( seq.model.steps[key].location );
                            if (foundseq){
                                /// todo , make this selection an option
                                that.thegrid.model.selectedcell = seq.model.steps[key].location;
                                console.log("selected cell is " ); 
                                console.log(that.thegrid.model.selectedcell);

                                if (key === keys[0]){ /// if the first cell is first beat of found sequence then revise it
                                    let step = foundseq.getStepFromLocation( seq.model.steps[0].location ); 
                                    let beat = foundseq.getStepBeat( step );
                                    let removedbeats = foundseq.reviseBeat(seq, beat);

                                    //if (that.push){ /// todo bad solution
                                    //    for(step of removedbeats){
                                    //        that.push.padWrite( step.location.row, step.location.column, 0 );
                                    //        console.log( step.location );
                                    //    }
                                    //}
                                    //return true;

                                }
                                break; 
                            } 
                        }
                        return false;
                    }
                };
                */

                // if no overlap put into grid with reference to sequence 
                for( let key of Object.keys(seq.model.steps)){
                    let loc = seq.model.steps[key].location;
                    that.thegrid.addcell( loc, seq );
                }

                //seq.model.currentstep = 0;
                //seq.model.playing = true; // todo: defer this to actual playing?

                that.model.sequencestostart.push( seq );

                if(seq.model.addingsequencetoselect === true){that.model.selectedsequence = seq ; console.log('squence was selected by adding');};

                that.model.sequences.push(seq);

                return true;
            },
            args: ["{that}", "{arguments}.0"]
        },
        /*
         *TODO put the step adding and removing into separate functions
        addsteps: {},
        removesteps: {
            func: function(that, seq, stepz){
                for ( key in steps ){
                }
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        */
        popsequence: {
            func: function(that){
                let thesequence = that.model.sequences.pop();
                if (thesequence === undefined) {
                    return thesequence;
                }
                for ( key in thesequence.model.steps ){ // or just pass on to remove? 
                    let step = thesequence.model.steps[key];
                    that.thegrid.removecell( step.location );
                }
                that.thegrid.events.gridChanged.fire(); 
                return thesequence;
            },
            args: "{that}"
        },
        removesequence: {
            func: function(that, seq){
                var deletedsequence;
                if (seq === undefined){ 
                    console.log('trying to delete sequence that does not exist');
                }else{
                    deletedsequence = that.getsequence(seq);
                    for (key in deletedsequence.model.steps){
                        let step = deletedsequence.model.steps[key];
                        that.thegrid.removecell (step.location );
                    }
                    that.model.sequences.splice( that.model.sequences.indexOf(deletedsequence), 1);
                    that.thegrid.events.gridChanged.fire(); 
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        mutesequence: {
            func: function(that, seq){
                that.getsequence(seq).mute = true;
                return true;
            },
            args: ["{that}", "{arguments}.0"]
        },
        selectsequence: {
            func: function(that, seq){
                if ( that.getsequence(seq) !== -1 ){ 
                    that.model.selectedsequence = seq;
                    return true;
                }else{
                    return false;
                }
            },
            args: ["{that}", "{arguments}.0"]
        }
    }
});

