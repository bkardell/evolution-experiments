import { EvoCanvasPopulation } from "./evo-population.js";
    
let create = (communicator) => {
  return async function(e) {
    let painter = await import(`/${e.data.painterModule || 'rectangle-gene-painter.js'}`);

    let evoPop = new EvoCanvasPopulation({
      goalImage: e.data.goal,
      genePainter: painter.default,
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

if (self) {
  self.onmessage = (evt) => {
    create(postMessage)(evt)
  }
}

export default create;