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

function array(length, min, max) {
  let ret = []
  for (let i=0;i<length;i++) {
    ret.push(randomInclusiveInt(min, max))
  }
  return ret;
}

export { randomInclusiveInt, isOneInNChance }