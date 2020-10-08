class MixedEvolver extends customElements.get('img-evolver') {
  breed (a, b) {
    let inheritingFromParent = a
    // 50/50 chance this will be clone of parent 
  //  (Math.floor(Math.random() * 2 + 1) === 1) 

    return a.map((gene, i) => {
      if (i+2 % this.numberOfShapes === 0) {
        inheritingFromParent = (this.isOneInNChance(10)) ? b : a
      }
      return inheritingFromParent[i]
    })
  }
  reproduce(individual, i) {
       if (this.isOneInNChance(this.canvasesPopulation.length)) {
        return this.breed(
            this.canvasesPopulation[0].genes, 
            individual.genes
          )
      } else {
        return this.randomMutation(this.canvasesPopulation[0].genes)
      }
  }
  
}

customElements.define('mixed-evolver', MixedEvolver)

