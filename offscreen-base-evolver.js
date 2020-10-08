// Genetic Algorithm!
{
  // size of everything. not really changeable at the moment because all genes go from 0-255.
  const size = 256;
  const populationSize = 24;
  

  const canvasPopulationContainer = document.querySelector(".population");
  const generationNumContainer = document.querySelector(".generation");
  const bestScoreContainer = document.querySelector(".best-score");
  const generationsSinceContainer = document.querySelector(
    ".generations-since-last"
  );

  var worker = new Worker("advanced-offscreen-worker-mixed.js");

  class Evolver extends HTMLElement {

    addCapture() {
      let currentBest = this.containers.best.querySelector('canvas')
      
      let e = document.createElement('div')
      e.innerHTML = `<canvas width="${currentBest.width}" height="${currentBest.height}"></canvas>
        <div>Generation ${this.generationNum} (${this.effectiveGeneLength} genes - ${Math.round(this.bestEverScore)} in ${Math.round(this.timeTillImprovement/1000)}s)</div>`
      let newCanvas = e.querySelector('canvas')
      
      newCanvas.getContext('2d').drawImage(currentBest, 0, 0);
      if(typeof caps !== 'undefined') {
        caps.appendChild(e)
        this.caps++
        if (this.capsPct > 1 && this.capsPct % 5 == 0) {
          this.capsPct--
        }
      }
    }
    
    constructor() {
      super();
      this.bestEverScore = null;
      this.bestEverGeneration = 0;
      this.numberOfShapes = this.getAttribute("num-shapes") || 256;
      this.attachShadow({ mode: "open" });
      this.caps = 0;
      this.capsPct = 5;

      if (this.hasAttribute("src")) {
        this.src = this.getAttribute("src");
      }
    }

    set src(url) {
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        createImageBitmap(img).then((bmp) => {
          this.init(bmp);
        })
      };
      img.src = url;
    }


    init(img) {

      
      worker.postMessage({ goal: img }, [
        img
      ]);
      
      
      
      worker.onmessage = (evt) => {
        this.generationNum = evt.data.generation;
        this.containers.generationNumber.innerText = this.generationNum.toLocaleString();
        this.containers.fitness.innerText = evt.data.fittest.toLocaleString();
        let capture = false;
        
        if (!this.bestEverScore) {
          this.bestEverScore = evt.data.fittest
          this.lastRecordedScore = this.bestEverScore
          this.percentage = this.bestEverScore / 100
          this.improvement = this.bestEverScore;
          this.startTime = Date.now()
        }
        if (evt.data.fittest < this.bestEverScore) {
          this.bestEverScore = evt.data.fittest
          this.improvement = this.lastRecordedScore - evt.data.fittest
          
          if (this.improvement > (this.percentage * this.capsPct)) {
            capture = true;
          }
          
          this.bestEverGeneration = evt.data.generation
          // todo: fix this when I am done experimenting, not all experiments have it
          this.effectiveGeneLength = evt.data.effectiveGeneLength || 256
          this.containers.bestGeneration.innerHTML = `Generation ${this.bestEverGeneration.toLocaleString()} (-${this.bestEverScore.toLocaleString()} - ${this.effectiveGeneLength} genes)`
          
        }
        
        
        if (capture) {
          this.lastRecordedScore = evt.data.fittest
          this.timeTillImprovement = Date.now() - this.startTime;
          this.addCapture()
          this.startTime = Date.now()
        }
         
      }
      
      

      this.generationNumber = 1;
      this.generationsSinceLastImprovement = 0;

      //TODO: figure out a good way to do total improvement
      // or rate of improvement or something, this is
      // basically hidden right now because it is not right
      this.totalImprovement = 0;

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
              <p style="display:none"><span class="total-improvement">0</span> total improvement</p>
              <p>Fitness -<span class="fitness">?</span></p>
              <p>Best Ever: <span class="best-generation">0</span></p>
              
            </div>
        </div>
      `;
      // and grab some easy to reference hooks
      this.containers = {
        goal: this.shadowRoot.querySelector(".goal"),
        best: this.shadowRoot.querySelector(".best"),
        generationNumber: this.shadowRoot.querySelector(".generation-num"),
        bestGeneration: this.shadowRoot.querySelector('.best-generation'),
        totalImprovement: this.shadowRoot.querySelector(".total-improvement"),
        fitness: this.shadowRoot.querySelector(".fitness"),
        population: this.shadowRoot.querySelector(".population")
      };

      let goalCanvas = document.createElement('canvas')
      
      // Add the goal, because this only needs to happen at init time
      this.containers.goal.appendChild(goalCanvas);

      let targetCanvas = this.containers.best.querySelector('canvas')
      
      let tgoalCanvas = goalCanvas.transferControlToOffscreen()
      worker.postMessage({ canvas: tgoalCanvas }, [tgoalCanvas]);

      let ttargetCanvas = targetCanvas.transferControlToOffscreen()
      worker.postMessage({ target: ttargetCanvas }, [ttargetCanvas]);
    
    }


  }

  customElements.define("mixed-evolver", Evolver);
}
