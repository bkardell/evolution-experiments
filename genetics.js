import { randomInclusiveInt, isOneInNChance } from "./random.js";

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
    } else {
      // do nothing, it's a perfect clone
    }
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

export { Genetics };
