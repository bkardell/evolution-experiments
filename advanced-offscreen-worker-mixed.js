// number of shapes. More is more accurate, but slow!
let n = 200;

let goalImg;

// The goal image canvas context
let goalContext;

// The data from the goal context
let goalData;

let goalW, goalH;

let targetContext;

// There will be a 'population' of canvases
let canvasesPopulation = [];

let fittestCanvas;

let bestEverScore;

let generationNumber = 1;

let generationsSinceLastImprovement;

let bestEverGeneration;

let totalImprovement = 0;

let baseImprovement = 0;

let populationSize = 10;

let breedingEnabled = true; 
let extensionContractionEnabled = true;

function randomInclusiveInt(a, b) {
  let min = Math.floor(a);
  let max = Math.floor(b);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function isOneInNChance(N) {
  let picked = randomInclusiveInt(1, N);
  return picked === 1;
}

function randomMutation(genes) {
  let mutated = new Uint8ClampedArray(genes);
  // randomly change some stuff
  let geneToMutate = Math.floor(Math.random() * mutated.length);
  mutated[geneToMutate] = Math.floor(Math.random() * 256);
  return mutated;
}

function effectiveGeneLength (genes) {
  return (genes.length - 3) / 8
}

function breed(a, b) {
  let inheritingFromParent = a;
  // 50/50 chance this will be clone of parent
  //  (Math.floor(Math.random() * 2 + 1) === 1)
  let bigger = a.length > b.length ? a : b;

  return bigger.map((gene, i) => {
    // one in 10 chance of inheriting from non-winning set
    inheritingFromParent = isOneInNChance(10) ? b : a;

    // flip them
    if (inheritingFromParent.length < i) {
      inheritingFromParent = inheritingFromParent == a ? b : a;
    }

    return inheritingFromParent[i];
  });
}

function reproduce(individual, i) {
  // 1:1000 to get more or less
  if (i > 0) {
    // assume we keep the best, always
    if (extensionContractionEnabled && isOneInNChance(100)) {
      individual.genes = new Uint8ClampedArray(canvasesPopulation[0].genes);

      if (individual.effectiveGeneLength > 100 && isOneInNChance(2)) {
        oneLessGene(individual);
      } else if (individual.effectiveGeneLength < 500) {
        oneMoreGene(individual);
      }
      return individual.genes
    }

    if (breedingEnabled && 
      (generationNumber % 10 == 0 ||
      isOneInNChance(canvasesPopulation.length / 2))
    ) {
      return breed(canvasesPopulation[0].genes, individual.genes);
    } else {
      return randomMutation(canvasesPopulation[randomInclusiveInt(0, 1)].genes);
    }
  } else {
    return canvasesPopulation[0].genes;
  }
}

function nextGeneration() {
  // the first thing we'll do is sort the population
  // to that the 'fittest' (lowest .score value) is first
  canvasesPopulation = canvasesPopulation.sort((a, b) => {
    if (a.score > b.score) return 1;
    if (b.score > a.score) return -1;
    return 0;
  });

  fittestCanvas = canvasesPopulation[0];

  // update
  targetContext.drawImage(fittestCanvas, 0, 0);

  generationNumber++;

  postMessage({
    generation: generationNumber,
    fittest: fittestCanvas.score,
    effectiveGeneLength: fittestCanvas.effectiveGeneLength
  });

  let newGenes = canvasesPopulation.map(reproduce);

  // then we draw/score
  canvasesPopulation.forEach((indiv, i) => {
    // we simply reuse the canvases assigning them new genes
    indiv.genes = newGenes[i];
    indiv.effectiveGeneLength = effectiveGeneLength(indiv.genes)

    // repaint them
    paintGenes(indiv);

    // update their score
    indiv.score = scoreGenes(indiv, goalData);

    if (indiv.score < fittestCanvas.score) {
      if (bestEverScore < fittestCanvas.score) {
        generationsSinceLastImprovement = 0;
        bestEverScore = fittestCanvas.score;
        bestEverGeneration = generationNumber;
      }
      generationsSinceLastImprovement = 0;
      if (totalImprovement === 0) {
        // we'll count this as 1
        baseImprovement = fittestCanvas.score - indiv.score;
        totalImprovement = 1;
      } else {
        totalImprovement += fittestCanvas.score - indiv.score - baseImprovement;
      }
    }
  });
  requestAnimationFrame(nextGeneration);
}

/*
  Genes are ints 
    [0]left, 
    [1]top, 
    [2]right, 
    [3]bottom, 
    [4]red, 
    [5]green, 
    [6]blue, 
    [7]alpha 
*/

// actually does the work of 'painting' genes to a canvas
function paintGenes(canvas) {
  let ctx = canvas.getContext("2d");
  let width = canvas.width;
  let height = canvas.height;
  let genes = canvas.genes;
  // background
  ctx.fillStyle = `rgb(${genes[0]}, ${genes[1]}, ${genes[2]})`;
  ctx.fillRect(0, 0, width, height);

  // draw lines;
  for (let i = 0; i < canvas.effectiveGeneLength; i++) {
    let index = i * 8 + 3;
    let line = genes.slice(index, index + 8);
    let x1 = line[0];
    let y1 = line[1];
    let x2 = line[2];
    let y2 = line[3];

    ctx.fillStyle = `rgba(${line[4]}, ${line[5]}, ${line[6]}, ${line[7] /
      255})`;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }
}

function oneLessGene(individualCanvas) {
  individualCanvas.effectiveGeneLength--;
  let genes = new Uint8ClampedArray(
    3 + individualCanvas.effectiveGeneLength * 8
  );
  let skip = randomInclusiveInt(0, individualCanvas.effectiveLength);
  let mod = 0;
  for (let i = 0; i < genes.length; i++) {
    if (i == skip) {
      mod = -1;
    }
    genes[i] = individualCanvas.genes[i - mod];
  }

  individualCanvas.genes = genes;
}

function oneMoreGene(individualCanvas) {
  let oldLength = 3 + individualCanvas.effectiveGeneLength * 8;
  individualCanvas.effectiveGeneLength++;

  let genes = new Uint8ClampedArray(
    3 + individualCanvas.effectiveGeneLength * 8
  );
  for (let i = 0; i < genes.length; i++) {
    genes[i] =
      i < oldLength
        ? individualCanvas.genes[i]
        : individualCanvas.genes[i - 8 + 3];
  }

  individualCanvas.genes = genes;
}

function scoreGenes(canvas, goalData) {
  let ctx = canvas.getContext("2d");
  let imageData = ctx.getImageData(0, 0, 256, 256);
  let data = imageData.data;
  let goal = goalData;
  let score = 0;

  // imagedata is [r,g,b,a,r,g,b,a...]
  for (let i = 0; i < data.length; i += 4) {
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let goalLum =
      0.299 * goal.data[i] +
      0.587 * goal.data[i + 1] +
      0.114 * goal.data[i + 2];

    // give you a max of 255

    // luminacity is _far_ more important than color
    score += Math.abs(goalLum - lum) * 0.1;

    score += Math.abs(goal.data[i] - data[i]) * 0.03;
    score += Math.abs(goal.data[i + 1] - data[i + 1]) * 0.03;
    score += Math.abs(goal.data[i + 2] - data[i + 2]) * 0.03;
  }

  score += canvas.effectiveGeneLength * 0.01;
  return score; //Math.round(score);
}

// Waiting to receive the OffScreenCanvas
self.onmessage = function(e) {
  if (e.data && e.data.goal) {
    console.log("got goal");
    goalImg = e.data.goal;
  } else if (e.data && e.data.canvas) {
    console.log("got goal canvas");
    let goalCanvas = e.data.canvas;
    goalContext = goalCanvas.getContext("2d");
    goalCanvas.width = 256;
    goalCanvas.height = 256;
    goalContext.drawImage(
      goalImg,
      0,
      0,
      goalImg.width,
      goalImg.height,
      0,
      0,
      256,
      256
    );
    goalData = goalContext.getImageData(0, 0, 256, 256);

    for (var i = 0; i < populationSize; i++) {
      // we populate this with a bunch of 'individivuaral' canvases
      let individualCanvas = new OffscreenCanvas(256, 256);

      individualCanvas.effectiveGeneLength = randomInclusiveInt(100, n);

      // each will get it's own 'genes'
      let genes = new Uint8ClampedArray(
        3 + individualCanvas.effectiveGeneLength * 8
      );

      // which we initialize those genes with random dna
      // you can kind of think of these as 'settlers' in
      // a fictional space where our population will live
      for (let i = 0; i < genes.length; i++) {
        genes[i] = Math.floor(Math.random() * 256);
      }

      // we'll tack these to the element
      individualCanvas.genes = genes;

      // we'll 'paint' that individual
      paintGenes(individualCanvas);

      // and score it
      individualCanvas.score = scoreGenes(individualCanvas, goalData);

      // and place them in the population
      canvasesPopulation.push(individualCanvas);
    }
  } else if (e.data && e.data.target) {
    console.log("got target");
    targetContext = e.data.target.getContext("2d");
    e.data.target.width = 256;
    e.data.target.height = 256;
    nextGeneration();
    // another for the population
  }
};
