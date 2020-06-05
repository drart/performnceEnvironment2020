//// todo 
// writes to hardward should instead call to ststae and let changeappliers work


fluid.defaults("controllertogridmapper", {
    gradeNames: ["fluid.modelComponent"], // push controller
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
    },
    events: {
        removesequence: null,
        selectcell: null,
        setcellpayload: null,
        gridaction: null
    },
    gridsize: {rows: 8, columns: 8},
    notedown: undefined,
    listeners: {
        /*
        "{push}.events.knobmoved": {
            func: function(that, msg){
                if (msg.value === 71 ) { // first knob
                    //var val = a.model.selectedsequence.
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        */
        "{push}.events.noteOn": {
            funcName: "adam.midi.push.gridNoteOn",
            args: ["{that}", "{arguments}.0"]
        },
        "{push}.events.noteOff": {
            funcName: "adam.midi.push.gridNoteOff",
            args: ["{that}", "{arguments}.0"]
        },
        selectcell: {
            func: function(that, cell){
                if(that.model.selectedcell !== undefined){
                    that.push.padWrite(that.model.selectedcell.row, that.model.selectedcell.column, 1);
                    that.model.lastselectedcell === that.model.selectedcell;
                }
                that.model.selectedcell = cell;
                that.push.padWrite(cell.row, cell.column, 13);

                // TODO make this better
                //a.model.sequences[0].setlocationpayload(that.model.selectedcell, 100);
            },
            args: ["{that}", "{arguments}.0"]
        },
        setcellpayload: {
            func: function(that, cell, payload){ // seq instead of that?
                a.model.selectedsequence.setlocationpayload( cell, payload ); // todo: this should be for the grid not the sequence...
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        
        /*
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
       gridaction: { 
           func: function(that, cell){
               if(that.model.mode = "grid") that.gridmapping(cell);
               if(that.model.mode = "notes") that.notemapping(cell);
           },
           args: ["{that}"],
       },
    },
    invokers: {
        addsequence: {
            func: function(that){},
            args: ["{that}"]
        },
        gridmapping: {
            func: function(that, region){
                if ( Array.isArray(region) ){
                }else{
                }
            },
            args: ["{that}", "{arguments}.0"]
        },
        notemapping: {
            func: function(that, note){
                // selectedsynth.noteOn(note);
            },
            args: ["{that}", "{arguments}.0"]
        }
    }
});





//------------------------------------------
// grid to push mappings
//------------------------------------------
fluid.defaults("adam.pushState", {
    gradeNames: "fluid.modelComponent",
    model: {
        mode: "grid", // envelope, sequence, payload
        sequencePads: {
            "0": {
                enabled: false,
                colour: 98
            }
        },
        samplePads: {
            "0": {
                enabled: true
            }
        }
    },
    modelListeners:{},
    listeners: {
        addsequence: {
            funcName: "adam.pushState.addsequence",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        } // add sequence to sequencer 
    },
    invokers: {}
});


adam.pushState.addsequence = function(that, startpos, endpos){
    adam.grid.addsequence();
};

///////  abstrsact to only define grid ragions
adam.midi.push.gridNoteOn = function(that, msg){
    if (msg.note < 30){
        that.events.knobtouched.fire(msg);
        return;
    } 

    var pos = pushNotesToGrid(msg);

    ///TODO: decouple message from mapping to sequence adding
    // define a region 
    if (that.options.notedown !== undefined && that.options.notedown !== msg.note){

        var startpoint, endpoint; 
        if (msg.note < that.options.notedown){
            startpoint = pushNotesToGrid (msg);
            endpoint = pushNotesToGrid (that.options.notedown);
        }else{
            endpoint = pushNotesToGrid (msg);
            startpoint = pushNotesToGrid (that.options.notedown);
        };

        // todo better payload additions 
        var stepz = [];
        var beats = endpoint.row - startpoint.row + 1;
        //console.log(endpoint.row + ",", + startpoint.row);

        for (var r = startpoint.row; r <= endpoint.row; r++){
            if(endpoint.row !== startpoint.row){ 
                stepz.push([]);// mutli beat row
            }
            for (var c = startpoint.column; c <= endpoint.column; c++){
                var payload = {"func": "trig", "args": 1000};
                payload.location = {row: r, column: c}; 
                //thegrid.addcell(payload.location); // bug?

                if(endpoint.row === startpoint.row){
                    stepz.push(payload); // single beat sequence 
                }else{

                    stepz[r-startpoint.row].push(payload); //multi beat sequence
                }
                that.push.padWrite(r, c);
            }
        }

        that.addsequence(stepz);

        that.options.notedown = undefined;
    }else{

        that.options.notedown = msg.note;
    };
};

adam.midi.push.gridNoteOff = function(that, msg){
    if (msg.note < 30){
        that.events.knobtouched.fire(msg);
        return;
    } 

    if (msg.note === that.options.notedown){
        var pos = pushNotesToGrid(msg);

        /// TODO abstract // define region and fire event
        var payload= {"func": "trig", "args": 200};
        payload.location = pos;
        that.addsequence([payload]);
    }
    that.options.notedown = undefined;
};

function pushNotesToGrid(msg){
    var notenumber; 
    if (typeof msg === "number")
        notenumber = msg;
    else
        notenumber = msg.note;

    return ({ 
        row: Math.floor((notenumber - 36) / 8),
        column: (notenumber-36) % 8 
    });
};

function pushKnobToMapping(msg, stepsize){
    if(msg.value){return msg.value * stepsize};
};
