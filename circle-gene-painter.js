// Note: Dont use fat arrow!
export default function(x, y, radius, four, r, g, b, a) {
  let startAngle = 0; // Starting point on circle
  let endAngle = 360; //Math.PI + (Math.PI * four) / 2; // End point on circle

  let circle = new Path2D();
  circle.arc(
    this.xUnit * x,
    this.yUnit * y,
    Math.round(radius / this.xUnit),
    0,
    2 * Math.PI
  );
  this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  this.ctx.fill(circle);
}
