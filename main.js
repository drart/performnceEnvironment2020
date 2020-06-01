"use strict";                                                                                                
  
var fluid = require("infusion");
require("infusion-electron");
require("./sequencer-app.js");

var performer = fluid.registerNamespace("performer");
performer.app();
