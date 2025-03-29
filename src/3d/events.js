import * as THREE from 'three';

class EventSystem {
  constructor(scene) {
    this.scene = scene;
    this.events = {
      bird_flyby: this.createBirdFlyby.bind(this),
      ufo_flash: this.createUFOFlash.bind(this),
      deer: this.createDeer.bind(this)
    };
    this.activeEvents = new Map();
  }
  
  createBirdFlyby() {
    const birds = new THREE.Group();
    const birdCount = 5;
    
    // Create bird voxels
    for (let i = 0; i < birdCount; i++) {
      const bird = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      
      // Random starting positions
      bird.position.set(
        Math.random() * 10 - 5,
        Math.random() * 2 + 3,
        -10
      );
      
      birds.add(bird);
    }
    
    this.scene.add(birds);
    
    return {
      object: birds,
      duration: 8000,
      update: (time) => {
        birds.children.forEach((bird, i) => {
          // Sinusoidal flight path
          bird.position.x += Math.sin(time * 0.001 + i) * 0.02;
          bird.position.y += Math.cos(time * 0.001 + i) * 0.01;
          bird.position.z += 0.05;
          
          // Reset position if bird flies too far
          if (bird.position.z > 5) {
            bird.position.z = -10;
          }
        });
      },
      cleanup: () => {
        this.scene.remove(birds);
      }
    };
  }
  
  createUFOFlash() {
    const light = new THREE.PointLight(0x00ff00, 0, 20);
    light.position.set(0, 10, -5);
    this.scene.add(light);
    
    return {
      object: light,
      duration: 5000,
      update: (time) => {
        light.position.x = Math.sin(time * 0.001) * 5;
        light.position.z = Math.cos(time * 0.001) * 5 - 5;
        light.intensity = 1.5 + Math.sin(time * 0.002) * 0.5;
      },
      cleanup: () => {
        this.scene.remove(light);
      }
    };
  }
  
  createDeer() {
    // Create deer silhouette using voxels
    const deer = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    deer.add(body);
    
    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    head.position.set(0.5, 0.3, 0);
    deer.add(head);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const legMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    [-0.3, 0.3].forEach(x => {
      [-0.1, 0.1].forEach(z => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(x, -0.5, z);
        deer.add(leg);
      });
    });
    
    // Position deer at horizon
    deer.position.set(10, 0, -15);
    this.scene.add(deer);
    
    return {
      object: deer,
      duration: 10000,
      update: (time) => {
        // Move deer across horizon
        deer.position.x -= 0.03;
        
        // Subtle head movement
        head.rotation.x = Math.sin(time * 0.001) * 0.1;
        
        // Remove when out of view
        if (deer.position.x < -10) {
          this.scene.remove(deer);
        }
      },
      cleanup: () => {
        this.scene.remove(deer);
      }
    };
  }
  
  triggerRandomEvent() {
    const eventNames = Object.keys(this.events);
    const randomEvent = eventNames[Math.floor(Math.random() * eventNames.length)];
    this.triggerEvent(randomEvent);
  }
  
  triggerEvent(eventName) {
    if (!this.events[eventName] || this.activeEvents.has(eventName)) return;
    
    const event = this.events[eventName]();
    this.activeEvents.set(eventName, {
      ...event,
      startTime: Date.now()
    });
    
    setTimeout(() => {
      const activeEvent = this.activeEvents.get(eventName);
      if (activeEvent) {
        activeEvent.cleanup();
        this.activeEvents.delete(eventName);
      }
    }, event.duration);
  }
  
  update() {
    const currentTime = Date.now();
    this.activeEvents.forEach((event, eventName) => {
      const eventTime = currentTime - event.startTime;
      event.update(eventTime);
    });
  }
  
  dispose() {
    this.activeEvents.forEach(event => {
      event.cleanup();
    });
    this.activeEvents.clear();
  }
}

export function initEvents(container) {
  return new EventSystem(container);
} 