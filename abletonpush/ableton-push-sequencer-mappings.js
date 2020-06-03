







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

function addsequence(stepz, pos){
    var s = adam.sequence();
    s.model.loop = true;
    s.settarget(selectedsynth());
    s.arraytosequence(stepz);
    if(a.addsequence(s)){ // check if it adds correctly, maybe use options instead? 
        a.selectsequence(s); 
    }
};
