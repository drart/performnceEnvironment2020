fluid.defaults("flock.demo.oscilOscil.nexusui", {
    gradeNames: "fluid.component",
    listeners: {
        onCreate: {
            func: function(){
                let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                width -=15;
                let oscilloscope = new Nexus.Oscilloscope('#scope', {size: [width, 100]});
                let spectrogram = new Nexus.Spectrogram('#spectogram', {size: [width, 100]})
                oscilloscope.connect(flock.environment.audioSystem.nativeNodeManager.outputNode);
                spectrogram.connect(flock.environment.audioSystem.nativeNodeManager.outputNode);
            }
        }
    }
});

