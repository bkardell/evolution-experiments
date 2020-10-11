// for use outside of worker
import {EvoCanvasPopulation} from '/evo-population.js'
 
 function promiseScript(path) {
  return new Promise((resolve, reject) => {
      let script = document.createElement('script')
      script.onload = resolve
      script.onerror= reject
      script.src = path
      document.head.appendChild(script)
  })
}

let create = (communicator) => { 
  return async function(e) {
    await promiseScript(`/${e.data.painterModule || 'rectangle-gene-painter.js'}`);

    let evoPop = new EvoCanvasPopulation({
      goalImage: e.data.goal,
      genePainter:  painter,
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
export default create
