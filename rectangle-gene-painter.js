function painter(top, right, bottom, left, r, g, b, a) {
  this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  this.ctx.fillRect(
    this.xUnit * left,
    this.yUnit * top,
    this.xUnit * right - this.xUnit * left,
    this.yUnit * bottom - this.yUnit * top
  );
};   