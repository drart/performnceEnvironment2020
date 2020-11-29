/// requires utils.js
//// todo 
// writes to hardward should instead call to state and let changeappliers work
fluid.defaults("adam.pushgridmapper", {
    gradeNames: ["fluid.modelComponent"], 
    model: {
        mode: "sequence", // notes, envelope
        action: "add", // delete, mute, select, solo, edit, ammend
        lastaction: undefined,
        selectedcell: undefined,
        lastselectedcell: undefined,
    },
    components: { 
        push: {
            type: "adam.midi.push",
        },
        sequencergrid: {
            type: "adam.grid",
        }
    },
    events: {
        regionCreated: null,
        selectcell: null,
        gridaction: null,
        overlapFound: null
    },
    notedown: undefined,
    modelListeners: {
        "{sequencergrid}.model.grid": {
            func: console.log,
            priority: "last",
            args: 'grid change applier fired'
        },
    },
    listeners: {
        /*
        "{push}.events.onReady": {
            nameSpace: "setupKnobs",
            funcName: "adam.midi.push.knobsToString",
            args: '{push}'
        },
        */
        "{push}.events.padPushed": {
            funcName: "adam.midi.push.gridNoteOn",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", ]
        },
        "{push}.events.padReleased": {
            funcName: "adam.midi.push.gridNoteOff",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", ]
        },
        "{sequencergrid}.events.gridChanged": {
            priority: "last",
            func: function(that){
                for(let r = 0; r < 8; r++){
                    for (let c = 0; c < 8 ; c++){
                        if ( that.sequencergrid.model.grid[r * 8 + c] !== undefined ){
                            that.push.padWrite(r, c);
                       }else{
                            that.push.padWrite(r, c, 0);
                        }
                    }
                }
            },
            args: "{that}"
        },
        /*
        "{push}.events.knob1": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob2": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob3": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob4": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob5": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob6": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob7": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
        "{push}.events.knob8": {
            funcName: "adam.midi.push.knobsToString",
            args: "{push}"
       },
    
        // rethink this
        setdeletemode: {
            func: function(that, val){
                if( that.model.action === "delete"){
                    that.model.action = that.model.lastaction; 
                }else{
                    that.model.lastaction = that.model.action;
                    that.model.action  = "delete";
                }

                //console.log( that.model);
                
                if ( that.model.action === "delete" ) {
                    that.push.events.deletemodedisplay.fire(true);
                }else{
                    that.push.events.deletemodedisplay.fire(false);
                }
            },
            args: ["{that}", "{arguments}.0"]
        } ,
        */
        /*
       gridaction: { 
           func: function(that, cell){
               if(that.model.mode = "grid") that.gridmapping(cell);
               if(that.model.mode = "notes") that.notemapping(cell);
           },
           args: ["{that}"],
       },
       */
    },
});

///////  abstrsact to only define grid ragions
adam.midi.push.gridNoteOn = function(that, pos, velocity){

    ///TODO: decouple message from mapping to sequence adding
    // todo check for overlapping
    //if (that.options.notedown !== undefined && that.options.notedown !== msg.note){
    if (that.options.notedown !== undefined ){

        var startpoint, endpoint; 
        if (pos.column < that.options.notedown.column){
            startpoint = pos;
            endpoint = that.options.notedown;
        }else{
            endpoint = pos
            startpoint = that.options.notedown;
        };

        // todo better payload additions 
        var stepz = [];
        var beats = endpoint.row - startpoint.row + 1;

        for (var r = startpoint.row; r <= endpoint.row; r++){
            if(endpoint.row !== startpoint.row){ 
                stepz.push([]);// mutli beat row
            }
            for (let c = startpoint.column; c <= endpoint.column; c++){
                //let payload = {"func": "trig", "args": 1000};
                let payload = {};
                payload.location = {row: r, column: c}; 

                if(endpoint.row === startpoint.row){
                    stepz.push(payload); // single beat sequence 
                }else{

                    stepz[r-startpoint.row].push(payload); //multi beat sequence
                }
            }
        }

        ///// test overlap    if no overlap then create region, otherwise look for grid mofiication or highlight
        if ( that.sequencergrid.checkzoneoverlap( stepz ) ){
            console.log('zone overlap, do seomthing rational here'); 
            // todo first overlapping cell should be the selectedcell
            // todo if the first cell of the new region is the first beat of an existing region then amend beat
            that.events.overlapFound.fire( stepz );
        }else{
            that.events.regionCreated.fire( stepz );
        }

        that.options.notedown = undefined;

    }else{

        that.options.notedown = pos;
    };
};

adam.midi.push.gridNoteOff = function(that, pos, velocity){

    if(that.options.notedown === undefined){ return; };

    if ( testTwoObjects(pos, that.options.notedown) ){ // should always be true 

        let payload = {};
        payload.location = pos;

        stepz = [payload];

        //that.events.regionCreated.fire( stepz );

    }else{
        console.log('something went wrong');
    }

    if( that.sequencergrid.checkcelloverlap( stepz[0].location )){
        //that.sequencergrid.model.selectedcell = pos; // todo should be done in the sequencer mappings
        that.events.selectcell.fire( pos );
    }else{
        that.events.regionCreated.fire( stepz );
    }

    that.options.notedown = undefined;
};

/*
//------------------------------------------
// grid to push mappings
//------------------------------------------
fluid.defaults("adam.pushState", {
    gradeNames: "fluid.modelComponent",
    model: {
        mode: "grid", // envelope, sequence, payload
        colours: {
            regionColour: 97,
            selectedColour: 93,
            beatColour: 99,
        },
    },
    modelListeners:{},
    listeners: {
    },
    invokers: {}
});

*/
