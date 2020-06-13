"use strict";

var fluid = require("infusion");

fluid.defaults("performer.app", {
    gradeNames: "electron.app",
    model: {
        commandLineSwitches: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: [
                    "autoplay-policy", 
                    "no-user-gesture-required"
                ]
            }
        }
    },
    components: {
        mainWindow: {
            createOnEvent: "onReady",
            type: "electron.browserWindow",
            options: {
                windowOptions: {
                    title: "infusion-electron Manual Test Window",
                    width: 720,
                    height: 480,
                    x: 100,
                    y: 100
                },

                model: {
                    url: {
                        expander: {
                            funcName: "fluid.stringTemplate",
                            args: [
                                "%url/sequencer.html",
                                "{app}.env.appRoot"
                            ]
                        }
                    }
                }
            }
        },
    }
});

