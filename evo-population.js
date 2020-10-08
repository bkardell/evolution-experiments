import { randomInclusiveInt, isOneInNChance } from './random.js'
import { EvoCanvas } from './evo-canvas.js'


class EvoCanvasPopulation {
  sort() {
    this.pop = this.pop.sort((a, b) => {
      if (a.computedFitness > b.computedFitness) return 1;
      if (b.computedFitness > a.computedFitness) return -1;
      return 0;
    });
  }
  
  get _fittest() {
    return this.pop[0]
  }
  
  
  nextGeneration() {
    
    // the first thing we'll do is sort the population
    // to that the 'fittest' (lowest .score value) is first
    this.sort()
    
    // notify
    this.cb({
      generation: this.generation++, 
      fittest: this._fittest
    })
  
    let fittest = this._fittest;
    this.pop.forEach((evoCanvas, i) => {
      if (i == 0) {
        evoCanvas.genetics.set(fittest.genetics)
      } else {
        evoCanvas.genetics.set(fittest.genetics, "mutate")
      }
      evoCanvas.computedFitness = evoCanvas.paint()
    })
    
  }
  
  
  constructor(conf={ 
    goalImage: null, 
    genePainter: null, 
    populationSize:10, 
    breedingEnabled: false,
    extensionContractionEnabled: false,
    callback: () => {}
  }) {
    this.pop = []
    this.generation = 1
    this.cb = conf.callback
    this.extensionContractionEnabled = conf.extensionContractionEnabled
    this.breedingEnabled = conf.breedingEnabled
    
    let prototype = new EvoCanvas(conf);
    for(var i=0; i<(conf.populationSize || 10); i++) {
      let evoCanvas = prototype.another()
      evoCanvas.computedFitness = evoCanvas.paint()
      this.pop.push(evoCanvas)
    }
  }
}

export { EvoCanvasPopulation }