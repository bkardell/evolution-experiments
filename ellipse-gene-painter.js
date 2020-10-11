// Note: Dont use fat arrow!
function painter(x, y, radius, rotation, r, g, b, a) {
  let startAngle = 0; // Starting point on circle
  let endAngle = 360; //Math.PI + (Math.PI * four) / 2; // End point on circle

  let shape = new Path2D();
  shape.ellipse(
    this.xUnit * x,
    this.yUnit * y,
    Math.round(radius / this.xUnit),
    Math.round(radius / this.yUnit),
    rotation,
    2 * Math.PI,
    false
  );
  this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  this.ctx.fill(shape);
}

// sigh... export default painter