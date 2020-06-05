fluid.defaults("gridtosequencermapper", {
    gradeNames: ["fluid.modelComponent"], // push controller
    model: {
        mode: "sequence", // notes, envelope
        action: "add", // delete, mute, select, solo, edit, ammend
        lastaction: undefined,
        selectedcell: undefined,
        lastselectedcell: undefined,
    },
    components: { 
    },
    events: {
        removesequence: null,
        selectcell: null,
        setcellpayload: null,
    },
    listeners: {
        setcellpayload: {
            func: function(that, cell, payload){ // seq instead of that?
                a.model.selectedsequence.setlocationpayload( cell, payload ); // todo: this should be for the grid not the sequence...
            },
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        removesequence: {
            func: console.log,
            args: "fadfadf"
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




function addsequence(stepz, pos){
    var s = adam.sequence();
    s.model.loop = true;
    s.settarget(selectedsynth());
    s.arraytosequence(stepz);
    if(a.addsequence(s)){ // check if it adds correctly, maybe use options instead? 
        a.selectsequence(s); 
    }
};
