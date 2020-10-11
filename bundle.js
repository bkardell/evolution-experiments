//The maximum is inclusive and the minimum is inclusive
function randomInclusiveInt(a, b) {
  let min = Math.floor(a);
  let max = Math.floor(b);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function isOneInNChance(N) {
  let picked = randomInclusiveInt(1, N);
  return picked === 1;
}

/*
  The data of our genetics object is 
  background-color-red
  background-color-green
  background-color-blue
  
  + a series of octo-genes 
   - each octo-genes series of 8 uint8 values from 0-255
*/
class Genetics {
  constructor(lengthOrMinGenes, maxGenes) {
    let size =
      typeof maxGenes != Number
        ? lengthOrMinGenes
        : randomInclusiveInt(lengthOrMinGenes, maxGenes);

    this.data = new Uint8ClampedArray(3 + size * 8);
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = this.createRandomGene();
    }
  }

  /* creates a random bit of genetic information */
  createRandomGene() {
    return randomInclusiveInt(0, 255);
  }

  get length() {
    return (this.data.length - 3) / 8;
  }

  /* Mutates the genes by removing one random bit of genetic info */
  shrinkGenes() {
    let r = 3 + randomInclusiveInt(0, this.length) * 8;
    this.data = this.data.filter((e, i) => {
      return i <= r || i > r + 8;
    });
  }

  /* 
    Mutates the genes by growing/double copy of one random bit 
    of genetic info at an arbitrary point
  */
  growGenes() {
    let insertionAt = 3 + randomInclusiveInt(0, this.length) * 8;
    let r = 3 + randomInclusiveInt(0, this.length) * 8;
    let newData = new Uint8ClampedArray(this.data.length + 8);
    newData.copyWithin(insertionAt, r, r + 8);
  }

  /*
    Randomly mutates one 'bit' of genetic information
  */
  mutate() {
    let geneToMutate = Math.floor(Math.random() * this.data.length);
    this.data[geneToMutate] = this.createRandomGene();
  }

  // this is the dominant parent
  breed(another) {
    let a = this.data,
        b = another.data,
        inheritingFromParent = a,
        bigger = a.length > b.length ? a : b;

    return bigger.map((gene, i) => {
      // one in 10 chance of inheriting from non-this set
      inheritingFromParent = isOneInNChance(10) ? b : a;

      // if there isn't enough, flip them
      if (inheritingFromParent.length < i) {
        inheritingFromParent = inheritingFromParent == a ? b : a;
      }

      return inheritingFromParent[i];
    });
  }

  set(source, type = "") {
    this.data = new Uint8ClampedArray(source.data);
    if (type === "mutate") {
      this.mutate();
    } else if (type === "shrink") {
      this.shrinkGenes();
    } else if (type === "grow") {
      this.growGenes();
    } else ;
  }

  // visit each octo-gene with 8 values
  forEach(fn, _this) {
    let d = this.data;
    for (let i = 0; i < this.length; i++) {
      fn.call(
        _this,
        d[3 + i * 8 + 0],
        d[3 + i * 8 + 1],
        d[3 + i * 8 + 2],
        d[3 + i * 8 + 3],
        d[3 + i * 8 + 4],
        d[3 + i * 8 + 5],
        d[3 + i * 8 + 6],
        d[3 + i * 8 + 7]
      );
    }
  }
}

class EvoCanvas {
  get imgData() {
    return this.ctx.getImageData(0, 0, 256, 256);
  }
  

  get fitness() {
    let imageData = this.imgData;
    let data = imageData.data;
    let goal = this.goalData;
    let score = 0;

    // imagedata is [r,g,b,a,r,g,b,a...]
    for (let i = 0; i < data.length; i += 4) {
      let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      // give you a max of 255
      let goalLum = 0.299 * goal[i] + 0.587 * goal[i + 1] + 0.114 * goal[i + 2];

      // luminacity is _far_ more important than color
      score += Math.abs(goalLum - lum) * 0.1;

      score += Math.abs(goal[i] - data[i]) * 0.03;
      score += Math.abs(goal[i + 1] - data[i + 1]) * 0.03;
      score += Math.abs(goal[i + 2] - data[i + 2]) * 0.03;
    }

    // Less genes is slightly better than more genes
    score += 0.01 * (this.genetics) ? this.genetic.length : (data.length/8);
    return score;
  }

  renderTo(destCanvas, setSize=true) {
    let destCtx = destCanvas.getContext('2d');  
    if (setSize) {
      destCanvas.width = this.canvas.width;
      destCanvas.height = this.canvas.height;
    }
    destCtx.drawImage(this.canvas, 0, 0, destCanvas.width, destCanvas.height);
  }
  
  _initCanvas(canvasImageSource) {
    let destCanvas;
    try {
      destCanvas = new OffscreenCanvas(
        canvasImageSource.width,
        canvasImageSource.height
      );
    } catch (e) {
      destCanvas = document.createElement("canvas");
      destCanvas.width = canvasImageSource.width;
      destCanvas.height = canvasImageSource.height;
    }
    this.canvas = destCanvas;
    this.ctx = destCanvas.getContext("2d");
  }

  constructor(conf={goalImage: null, genePainter: ()=> {}, genesMin: 100, genesMax:100}) {
    // internally used overloading
    if (conf.from) {
      this._initCanvas(conf.from.canvas);
      this.goalData = conf.from.goalData;    
      this.genePainter = conf.from.genePainter;
      this.genetics = new Genetics(conf.from.genetics.length);
    } else {  
      this._initCanvas(conf.goalImage);
      this.ctx.drawImage(conf.goalImage, 0, 0);  
      this.goalData = this.ctx.getImageData(0, 0, 256, 256).data;
      this.genePainter = conf.genePainter;
      this.goalImageFitness = this.fitness;
      this.genetics = new Genetics(conf.genesMin || 100, conf.genesMax || 100);
    }
    this.xUnit = Math.round(this.canvas.width / 255);
    this.yUnit = Math.round(this.canvas.height / 255);

  }

  
  another() {
    return new EvoCanvas({ from: this })
  }
  
  // returns fitness as of paint
  paint() {
    let rgb = this.genetics.data;
    this.ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.genetics.forEach(this.genePainter, this);
    return this.fitness
  }
}

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
    this.sort();
    
    // notify
    this.cb({
      generation: this.generation++, 
      fittest: this._fittest
    });
  
    let fittest = this._fittest;
    this.pop.forEach((evoCanvas, i) => {
      if (i == 0) {
        evoCanvas.genetics.set(fittest.genetics);
      } else {
        evoCanvas.genetics.set(fittest.genetics, "mutate");
      }
      evoCanvas.computedFitness = evoCanvas.paint();
    });
    
  }
  
  
  constructor(conf={ 
    goalImage: null, 
    genePainter: null, 
    populationSize:10, 
    breedingEnabled: false,
    extensionContractionEnabled: false,
    callback: () => {}
  }) {
    this.pop = [];
    this.generation = 1;
    this.cb = conf.callback;
    this.extensionContractionEnabled = conf.extensionContractionEnabled;
    this.breedingEnabled = conf.breedingEnabled;
    
    let prototype = new EvoCanvas(conf);
    for(var i=0; i<(conf.populationSize || 10); i++) {
      let evoCanvas = prototype.another();
      evoCanvas.computedFitness = evoCanvas.paint();
      this.pop.push(evoCanvas);
    }
  }
}

//export { EvoCanvasPopulation };
