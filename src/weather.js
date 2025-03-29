class Weather {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'canvas-container';
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.currentWeather = 'clear';
    this.particles = [];
    this.maxParticles = 100;

    this.weatherTypes = {
      clear: this.updateClear.bind(this),
      rain: this.updateRain.bind(this),
      fog: this.updateFog.bind(this),
      thunderstorm: this.updateThunderstorm.bind(this),
      snow: this.updateSnow.bind(this)
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  setWeather(weatherType) {
    if (this.weatherTypes[weatherType]) {
      this.currentWeather = weatherType;
      this.particles = [];
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.weatherTypes[this.currentWeather]();
  }

  // Weather effect methods
  updateClear() {
    // Clear weather doesn't need any particles
  }

  updateRain() {
    // Add new raindrops if needed
    while (this.particles.length < this.maxParticles) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -100,
        speed: 15 + Math.random() * 5,
        length: 10 + Math.random() * 10
      });
    }

    // Update and draw raindrops
    this.ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const drop = this.particles[i];
      
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x + 1, drop.y + drop.length);
      
      drop.y += drop.speed;
      drop.x += 1; // Slight angle to the rain

      if (drop.y > this.canvas.height) {
        this.particles.splice(i, 1);
      }
    }

    this.ctx.stroke();
  }

  updateFog() {
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  updateThunderstorm() {
    // First draw rain
    this.updateRain();

    // Randomly add lightning
    if (Math.random() < 0.005) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Thunder sound could be added here
    }
  }

  updateSnow() {
    // Add new snowflakes if needed
    while (this.particles.length < this.maxParticles) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -100,
        size: 2 + Math.random() * 4,
        speed: 1 + Math.random() * 2,
        wind: Math.random() * 2 - 1
      });
    }

    // Update and draw snowflakes
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const flake = this.particles[i];
      
      this.ctx.beginPath();
      this.ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      flake.y += flake.speed;
      flake.x += flake.wind;

      // Reset snowflake when it goes off screen
      if (flake.y > this.canvas.height) {
        this.particles.splice(i, 1);
      }
    }
  }
}

export function initWeather(container) {
  return new Weather(container);
} 