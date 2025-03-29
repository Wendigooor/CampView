class Scene {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'canvas-container';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.currentScene = 'lake';
    this.scenes = {
      lake: this.drawLake.bind(this),
      mountains: this.drawMountains.bind(this),
      city: this.drawCity.bind(this),
      ocean: this.drawOcean.bind(this),
      forest: this.drawForest.bind(this),
      desert: this.drawDesert.bind(this),
      plains: this.drawPlains.bind(this),
      volcano: this.drawVolcano.bind(this),
      tundra: this.drawTundra.bind(this),
      jungle: this.drawJungle.bind(this)
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  setScene(sceneName) {
    if (this.scenes[sceneName]) {
      this.currentScene = sceneName;
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.scenes[this.currentScene]();
  }

  // Scene drawing methods
  drawLake() {
    const { width, height } = this.canvas;
    
    // Sky
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height * 0.6);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height * 0.6);

    // Lake
    const waterGradient = this.ctx.createLinearGradient(0, height * 0.6, 0, height);
    waterGradient.addColorStop(0, '#4A90E2');
    waterGradient.addColorStop(1, '#2171B5');
    this.ctx.fillStyle = waterGradient;
    this.ctx.fillRect(0, height * 0.6, width, height * 0.4);
  }

  drawMountains() {
    const { width, height } = this.canvas;
    
    // Sky
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, width, height);

    // Mountains
    this.ctx.fillStyle = '#6B8E23';
    this.ctx.beginPath();
    this.ctx.moveTo(0, height * 0.7);
    this.ctx.lineTo(width * 0.3, height * 0.3);
    this.ctx.lineTo(width * 0.5, height * 0.6);
    this.ctx.lineTo(width * 0.7, height * 0.2);
    this.ctx.lineTo(width, height * 0.5);
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // Additional scene methods will be implemented similarly
  drawCity() {
    // Placeholder for city scene
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawOcean() {
    // Placeholder for ocean scene
    this.ctx.fillStyle = '#0077be';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawForest() {
    // Placeholder for forest scene
    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawDesert() {
    // Placeholder for desert scene
    this.ctx.fillStyle = '#F4A460';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlains() {
    // Placeholder for plains scene
    this.ctx.fillStyle = '#90EE90';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawVolcano() {
    // Placeholder for volcano scene
    this.ctx.fillStyle = '#8B0000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTundra() {
    // Placeholder for tundra scene
    this.ctx.fillStyle = '#F0F8FF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawJungle() {
    // Placeholder for jungle scene
    this.ctx.fillStyle = '#006400';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export function initScene(container) {
  return new Scene(container);
} 