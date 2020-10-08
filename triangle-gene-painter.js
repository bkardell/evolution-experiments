export default function(one, two, three, four, r, g, b, a) {
  this.ctx.beginPath();
  this.ctx.moveTo(this.xUnit * one, this.yUnit * two);
  this.ctx.lineTo((this.xUnit * 255) - (this.xUnit * three), this.yUnit * four);
  this.ctx.lineTo(this.xUnit * one - two, this.yUnit * two - three);

  this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  this.ctx.fill();
};