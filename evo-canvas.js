import { Genetics } from './genetics.js'

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
    let destCtx = destCanvas.getContext('2d')  
    if (setSize) {
      destCanvas.width = this.canvas.width
      destCanvas.height = this.canvas.height
    }
    destCtx.drawImage(this.canvas, 0, 0, destCanvas.width, destCanvas.height)
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
      this.goalData = conf.from.goalData    
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

export { EvoCanvas }