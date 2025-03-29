export function initEvents(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'absolute inset-0 w-full h-full z-20';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let currentEvent = null;
  
  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  
  class Event {
    constructor(type) {
      this.type = type;
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.alpha = 0;
      this.scale = 1;
    }
    
    update() {
      // Override in subclasses
    }
    
    draw() {
      // Override in subclasses
    }
    
    isDone() {
      return this.alpha <= 0;
    }
  }
  
  class ShootingStar extends Event {
    constructor() {
      super('shootingStar');
      this.x = -50;
      this.y = canvas.height * 0.3;
      this.speed = 15;
      this.trail = [];
      this.maxTrailLength = 20;
      this.alpha = 1;
    }
    
    update() {
      this.x += this.speed;
      this.y += this.speed * 0.2;
      
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.pop();
      }
      
      if (this.x > canvas.width + 100) {
        this.alpha -= 0.1;
      }
    }
    
    draw() {
      if (!ctx) return;
      
      ctx.save();
      ctx.globalAlpha = this.alpha;
      
      // Draw trail
      if (this.trail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw star
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      ctx.restore();
    }
    
    isDone() {
      return this.alpha <= 0;
    }
  }
  
  class Bird extends Event {
    constructor() {
      super('bird');
      this.x = -30;
      this.y = canvas.height * 0.4;
      this.wingSpan = 20;
      this.wingAngle = 0;
      this.speed = 5;
      this.alpha = 1;
    }
    
    update() {
      this.x += this.speed;
      this.wingAngle = Math.sin(Date.now() * 0.01) * Math.PI / 6;
      
      if (this.x > canvas.width + 50) {
        this.alpha -= 0.1;
      }
    }
    
    draw() {
      if (!ctx) return;
      
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      
      // Draw wings
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-this.wingSpan * Math.cos(this.wingAngle), -this.wingSpan * Math.sin(this.wingAngle));
      ctx.moveTo(0, 0);
      ctx.lineTo(this.wingSpan * Math.cos(this.wingAngle), -this.wingSpan * Math.sin(this.wingAngle));
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();
    }
    
    isDone() {
      return this.alpha <= 0;
    }
  }
  
  class Events {
    constructor() {
      this.events = [];
      this.lastEventTime = 0;
      this.minTimeBetweenEvents = 5000;
    }
    
    update() {
      // Update existing events
      this.events = this.events.filter(event => {
        event.update();
        return !event.isDone();
      });
      
      // Maybe trigger a new random event
      const now = Date.now();
      if (now - this.lastEventTime > this.minTimeBetweenEvents) {
        if (Math.random() < 0.1) {
          this.triggerRandomEvent();
          this.lastEventTime = now;
        }
      }
    }
    
    draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.events.forEach(event => event.draw());
    }
    
    triggerRandomEvent() {
      const eventTypes = [ShootingStar, Bird];
      const EventClass = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      this.events.push(new EventClass());
    }
  }
  
  // Initial setup
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  const events = new Events();
  
  return {
    update: () => {
      events.update();
      events.draw();
    },
    triggerRandomEvent: () => events.triggerRandomEvent(),
    dispose: () => {
      window.removeEventListener('resize', resizeCanvas);
    }
  };
} 