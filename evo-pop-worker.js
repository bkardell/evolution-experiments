
importScripts('./bundle.js')
    
let create = (communicator) => {
  return async function(e) {
    importScripts(`/${e.data.painterModule || 'rectangle-gene-painter.js'}`);
    let evoPop = new EvoCanvasPopulation({
      goalImage: e.data.goal,
      genePainter: painter,
      genesMin: e.data.genesMin || 100,
      callback: o => {
        o.fittest.renderTo(e.data.canvas);
        communicator({generation: o.generation, computedFitness: o.fittest.computedFitness});
      }
    });

    let run = () => {
      evoPop.nextGeneration();
      requestAnimationFrame(run);
    };
    run();
  };

}

if (typeof self !== 'undefined') {
  self.onmessage = (evt) => {
    create(postMessage)(evt)
  }
}
 