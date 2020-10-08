// Genetic Algorithm!
(function(){
// size of everything. not really changeable at the moment because all genes go from 0-255.
const size = 256;
const populationSize = 10;


const canvasPopulationContainer = document.querySelector('.population')
const generationNumContainer = document.querySelector('.generation')
const bestScoreContainer = document.querySelector('.best-score')
const generationsSinceContainer = document.querySelector('.generations-since-last')

// number of shapes. More is more accurate, but slow!
let n = 200;


  // actually does the work of 'painting' genes to a canvas
function paintGenes(canvas) {
  let ctx = canvas.getContext('2d');
  let width = canvas.width;
  let height = canvas.height;
  let genes = canvas.genes
  // background
  ctx.fillStyle = `rgb(${genes[0]}, ${genes[1]}, ${genes[2]})`;
  ctx.fillRect(0, 0, width, height); 

  // draw lines;
  for (let i = 0; i < n; i++) {
    let index = i * 8 + 3
    let line = genes.slice(index, index + 8);
    let x1 = line[0];
    let y1 = line[1];
    let x2 = line[2];
    let y2 = line[3];

    ctx.fillStyle = `rgba(${line[4]}, ${line[5]}, ${line[6]}, ${line[7] / 255})`;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }
}
  
 function scoreGenes(canvas, goalData) {
  let ctx = canvas.getContext('2d')
  let imageData = ctx.getImageData(0, 0, size, size)
  let data = imageData.data
  let goal = goalData
  let score = 0;
  // imagedata is [r,g,b,a,r,g,b,a...]
  for (let i = 0; i < data.length; i+=4) {
    let lum = .299 * data[i] + .587 * data[i+1] + .114 * data[i + 2];
    let goalLum = .299 * goal.data[i] + .587 * goal.data[i + 1] + .114 * goal.data[i + 2];
    score += Math.abs(goalLum - lum) * 10;
    score += Math.abs(goal.data[i] - data[i]) * .1;
    score += Math.abs(goal.data[i + 1] - data[i + 1]) * .1;
    score += Math.abs(goal.data[i + 2] - data[i + 2]) * .1;
  }
  return Math.round(score);
}

  
class Evolver extends HTMLElement {
  
  isOneInNChance(N) {
    let min = 1;
    let max = Math.floor(N);
    let picked =  Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive 
    return picked === 1

  }
  constructor() {
    super()
    this.bestEverScore = 0
    this.bestEverGeneration = 0;
    this.numberOfShapes = this.getAttribute('num-shapes') || n
    this.attachShadow({mode:'open'})
    
    if (this.hasAttribute('src')) {
      this.src = this.getAttribute('src')
    }
  }
  
  set src (url) {
    let img = new Image()
    img.crossOrigin = "Anonymous"
    img.onload =  () => { this.init(img) }
    img.src = url
  }
  
  randomMutation(genes) {
    let mutated = new Uint8ClampedArray(genes);
    // randomly change some stuff
    let geneToMutate = Math.floor(Math.random() * mutated.length);
    mutated[geneToMutate] = Math.floor(Math.random() * 256);
    return mutated;
  }
  
  reproduce(individual, i) {
    return this.randomMutation(this.canvasesPopulation[0].genes)
  }
  
  nextGeneration() {
    
    // the first thing we'll do is sort the population
    // to that the 'fittest' (lowest .score value) is first
    this.canvasesPopulation = this.canvasesPopulation.sort((a,b) => {
      if (a.score > b.score) return 1
      if (b.score > a.score) return -1
      return 0
    })
    
    let fittestCanvas = this.canvasesPopulation[0]
  
    
    this.containers.best.querySelector('canvas').replaceWith(fittestCanvas)
    this.containers.fitness.innerText = (fittestCanvas.score).toLocaleString()   
    this.containers.generationNumber.innerText = (this.generationNumber).toLocaleString()   
    
    // we map these to a new population of genes
    // so that if the reproduction phase doesn't change
    // the population as it goes
    let newGenes = this.canvasesPopulation.map(this.reproduce, this)
    
    // then we draw/score
    this.canvasesPopulation.forEach((indiv, i) => {
      // we simply reuse the canvases assigning them new genes
      indiv.genes = newGenes[i]
      
      // repaint them
      paintGenes(indiv)
      
      // update their score
      indiv.score = scoreGenes(indiv, this.goalData)
      
      if (indiv.score < fittestCanvas.score) {
        if (this.bestEverScore < fittestCanvas.score) {
          this.generationsSinceLastImprovement = 0
          this.bestEverScore = fittestCanvas.score
          this.bestEverGeneration = this.generationNumber
        }
        this.generationsSinceLastImprovement = 0
        if (this.totalImprovement === 0) {
          // we'll count this as 1
          this.baseImprovement =  (fittestCanvas.score - indiv.score)
          this.totalImprovement = 1
        } else {
          this.totalImprovement +=  (fittestCanvas.score - indiv.score) - this.baseImprovement
        }
      }
    })                          
  
    this.containers.sinceImprovement.innerText = (this.generationsSinceLastImprovement++ ).toLocaleString()                          
    this.containers.totalImprovement.innerText = (this.totalImprovement).toLocaleString()                         
    
    this.generationNumber++
  }
  
  init (img) {
    let goalCanvas = document.createElement('canvas'),
          goalContext = goalCanvas.getContext('2d')
      
      goalCanvas.width = size
      goalCanvas.height = size
      
      goalContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
      
      this.goalContext = goalContext
      this.goalData = goalContext.getImageData(0, 0, size, size);
      
      // There will be a 'population' of canvases
      this.canvasesPopulation = []
        
      // we populate this with a bunch of 'individivual' canvases 
      for (let i=0;i<populationSize;i++) {
        
        // we'll build a new one
        let individualCanvas = document.createElement('canvas')
        
        // it should be the same size
        individualCanvas.width = size
        individualCanvas.height = size
        
        // each will get it's own 'genes'
        let genes = new Uint8ClampedArray(3 + n * 8);
        
        // which we initialize those genes with random dna  
        // you can kind of think of these as 'settlers' in 
        // a fictional space where our population will live
        for (let i = 0; i < genes.length; i++) {
          genes[i] = Math.floor(Math.random() * 256);
        }
        
        // we'll tack these to the element
        individualCanvas.genes = genes 
        
        // we'll 'paint' that individual
        paintGenes(individualCanvas)

        // and score it
        individualCanvas.score = scoreGenes(individualCanvas, this.goalData)
      
    
        // and place them in the population
        this.canvasesPopulation.push(individualCanvas)
      }
    
      this.generationNumber = 1
      this.generationsSinceLastImprovement = 0
    
      //TODO: figure out a good way to do total improvement
      // or rate of improvement or something, this is
      // basically hidden right now because it is not right
      this.totalImprovement  = 0
    
      // we'll initialize some UI bits
      this.shadowRoot.innerHTML = `
        <style>
          .content {
              display: grid; 
              grid-template-columns: 1fr 1fr; 
          }  

          .stats {
            grid-column: 1/3;
          }

          canvas {
            width: 100%;
          }

         .total-improvement { display: none }
   
          p {
            margin: 0;
          }
        </style>
        <div class="content">
            <div class="goal">
              <div>goal</div>
            </div>
            <div class="best">
              <div>best</div>
              <canvas></canvas>
            </div>
            <div class="stats">
              <p>Generation # <span class="generation-num">0</span></p>
              <p><span class="since-improvement">0</span> since improvement</p>
              <p style="display:none"><span class="total-improvement">0</span> total improvement</p>
              <p>Fitness -<span class="fitness">?</span></p>

            </div>
            <div class="population">
            </div>
        </div>
      `
      // and grab some easy to reference hooks
      this.containers = {
        goal: this.shadowRoot.querySelector('.goal'),
        best: this.shadowRoot.querySelector('.best'),
        generationNumber: this.shadowRoot.querySelector('.generation-num'),
        sinceImprovement: this.shadowRoot.querySelector('.since-improvement'),
        totalImprovement: this.shadowRoot.querySelector('.total-improvement'),
        fitness: this.shadowRoot.querySelector('.fitness'),
        population: this.shadowRoot.querySelector('.population')
      }
    
      // Add the goal, because this only needs to happen at init time
      this.containers.goal.appendChild(goalCanvas)
    
      // and finally begin
      this.run()
  }
  

  run () {
    setTimeout(() => {
      this.nextGeneration()
      this.run()
    },0)
  }
  

}

customElements.define('img-evolver', Evolver)

}())