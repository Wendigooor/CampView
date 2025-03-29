// Tent mask shader with fixed triangle shape
const TentMaskShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'uAspect': { value: 1.0 },
    'uInnerLight': { value: 0.3 }, // Controls inner tent ambient light
    'uShadowSoftness': { value: 0.15 }, // Controls edge shadow softness
    'uShadowIntensity': { value: 0.8 } // Controls shadow darkness
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform float uInnerLight;
    uniform float uShadowSoftness;
    uniform float uShadowIntensity;
    varying vec2 vUv;

    float tentShape(vec2 pos) {
      // More realistic tent opening shape
      float tentTop = 0.8; // Height of tent opening
      float tentWidth = 0.6; // Width of tent opening
      float bottomCurve = 0.2; // How much the bottom curves
      
      // Calculate tent edges
      float leftEdge = smoothstep(-tentWidth, -tentWidth + uShadowSoftness, pos.x);
      float rightEdge = smoothstep(tentWidth - uShadowSoftness, tentWidth, pos.x);
      float topEdge = smoothstep(tentTop - uShadowSoftness, tentTop, pos.y);
      
      // Create curved bottom
      float bottomEdge = smoothstep(
        -bottomCurve, 
        -bottomCurve + uShadowSoftness,
        pos.y + pow(abs(pos.x / tentWidth), 2.0) * bottomCurve
      );
      
      // Combine edges
      return (1.0 - max(max(leftEdge, rightEdge), max(topEdge, 1.0 - bottomEdge)));
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 pos = (uv - center) * vec2(uAspect, 1.0);
      
      // Get tent shape
      float shape = tentShape(pos);
      
      // Calculate edge shadow
      float edgeShadow = 1.0 - smoothstep(0.0, 0.3, shape);
      
      // Get scene color
      vec4 sceneColor = texture2D(tDiffuse, uv);
      
      // Create warm tent interior color
      vec3 tentInterior = mix(
        vec3(0.05, 0.03, 0.02), // Very dark edge
        vec3(0.4, 0.35, 0.3) * (1.0 + uInnerLight), // Lighter interior with ambient
        smoothstep(0.0, 0.7, shape)
      );
      
      // Add subtle fabric texture without animation
      float fabric = sin(pos.x * 150.0) * sin(pos.y * 150.0) * 0.02;
      
      // Mix scene with tent edges and interior
      vec3 finalColor = mix(
        tentInterior,
        sceneColor.rgb,
        smoothstep(0.2, 0.8, shape + fabric)
      );
      
      // Apply edge shadows
      finalColor *= 1.0 - (edgeShadow * uShadowIntensity);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

// Voxel generation utilities
const VoxelUtils = {
  // Simplex noise for terrain generation
  noise: new SimplexNoise(),
  
  // Generate height for terrain
  getHeight(x, z, config) {
    const scale = config.scale || 0.1;
    const amplitude = config.amplitude || 10;
    const octaves = config.octaves || 4;
    
    let height = 0;
    let frequency = 1;
    let amplitude_sum = 0;
    
    for (let i = 0; i < octaves; i++) {
      height += this.noise.noise2D(x * scale * frequency, z * scale * frequency) * amplitude / frequency;
      amplitude_sum += amplitude / frequency;
      frequency *= 2;
    }
    
    return height / amplitude_sum;
  },
  
  // Create voxel mesh for terrain
  createTerrainMesh(config) {
    const voxelSize = 0.5;
    const gridSize = config.gridSize || 40;
    
    // Create instanced mesh for performance
    const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: config.roughness || 0.8,
      metalness: config.metalness || 0.1
    });
    
    const terrain = new THREE.InstancedMesh(
      geometry,
      material,
      gridSize * gridSize * config.maxHeight
    );
    
    let count = 0;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    // Generate terrain voxels
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const height = Math.floor(
          this.getHeight(x, z, config) * config.maxHeight
        );
        
        // Fill from bottom to top for solid terrain
        for (let y = 0; y < height; y++) {
          position.set(
            (x - gridSize/2) * voxelSize,
            (y - config.maxHeight/2) * voxelSize,
            (z - gridSize/2) * voxelSize
          );
          matrix.compose(position, quaternion, scale);
          terrain.setMatrixAt(count++, matrix);
        }
      }
    }
    
    terrain.count = count;
    terrain.instanceMatrix.needsUpdate = true;
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    
    return terrain;
  },
  
  // Create water mesh
  createWaterMesh(config) {
    const voxelSize = 0.5;
    const gridSize = config.gridSize || 40;
    
    const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    const material = new THREE.MeshStandardMaterial({
      color: config.waterColor || 0x001e0f,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const waterVoxels = new THREE.InstancedMesh(
      geometry,
      material,
      gridSize * gridSize
    );
    
    let count = 0;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    // Create flat water surface
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        position.set(
          (x - gridSize/2) * voxelSize,
          config.waterLevel * voxelSize,
          (z - gridSize/2) * voxelSize
        );
        matrix.compose(position, quaternion, scale);
        waterVoxels.setMatrixAt(count++, matrix);
      }
    }
    
    waterVoxels.count = count;
    waterVoxels.instanceMatrix.needsUpdate = true;
    
    return waterVoxels;
  }
};

// Updated scenery configurations with voxel settings
const SCENERY_CONFIGS = {
  Lake: {
    terrainColor: 0x2D5A27,
    fogColor: 0xb1c4dd,
    fogDensity: 0.015,
    voxel: {
      scale: 0.08,
      amplitude: 4,
      maxHeight: 10,
      waterLevel: -1,
      waterColor: 0x1a4a3c
    }
  },
  Mountains: {
    terrainColor: 0x4A4A4A,
    fogColor: 0xC8D1E0,
    fogDensity: 0.02,
    voxel: {
      scale: 0.05,
      amplitude: 15,
      maxHeight: 25,
      roughness: 0.9
    }
  },
  Forest: {
    terrainColor: 0x1B4D2E,
    fogColor: 0xA3B18A,
    fogDensity: 0.025,
    voxel: {
      scale: 0.1,
      amplitude: 8,
      maxHeight: 15,
      trees: true
    }
  },
  Desert: {
    terrainColor: 0xD4B483,
    fogColor: 0xF4D03F,
    fogDensity: 0.01,
    voxel: {
      scale: 0.03,
      amplitude: 6,
      maxHeight: 12,
      dunes: true
    }
  },
  Volcano: {
    terrainColor: 0x943126,
    fogColor: 0xE6B0AA,
    fogDensity: 0.03,
    voxel: {
      scale: 0.06,
      amplitude: 20,
      maxHeight: 30,
      lava: true,
      lavaColor: 0xff3300
    }
  }
};

// Weather effects
const WEATHER_EFFECTS = {
  Clear: {
    sunIntensity: 2.0,
    fogDensity: 0.01,
    ambientIntensity: 0.5
  },
  Rain: {
    sunIntensity: 0.5,
    fogDensity: 0.03,
    ambientIntensity: 0.3,
    particles: {
      count: 1000,
      size: 0.05,
      color: 0x6699ff,
      speed: 10,
      opacity: 0.6
    }
  },
  Snow: {
    sunIntensity: 1.0,
    fogDensity: 0.02,
    ambientIntensity: 0.7,
    particles: {
      count: 500,
      size: 0.08,
      color: 0xffffff,
      speed: 2,
      opacity: 0.8
    }
  },
  Fog: {
    sunIntensity: 0.3,
    fogDensity: 0.05,
    ambientIntensity: 0.4,
    fogColor: 0xcccccc
  },
  Storm: {
    sunIntensity: 0.2,
    fogDensity: 0.04,
    ambientIntensity: 0.3,
    particles: {
      count: 2000,
      size: 0.05,
      color: 0x6699ff,
      speed: 15,
      opacity: 0.4
    },
    lightning: {
      probability: 0.005,
      intensity: 3.0,
      duration: 150
    }
  }
};

class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.lightningLight = null;
    this.lightningTimeout = null;
  }
  
  createParticles(config) {
    // Remove existing particles
    if (this.particles) {
      this.scene.remove(this.particles);
    }
    
    // Create instanced mesh for particles
    const geometry = new THREE.BoxGeometry(config.size, config.size, config.size);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity
    });
    
    this.particles = new THREE.InstancedMesh(
      geometry,
      material,
      config.count
    );
    
    // Initialize particle positions
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    for (let i = 0; i < config.count; i++) {
      position.set(
        Math.random() * 40 - 20,
        Math.random() * 20 + 10,
        Math.random() * 40 - 20
      );
      matrix.compose(position, quaternion, scale);
      this.particles.setMatrixAt(i, matrix);
    }
    
    this.scene.add(this.particles);
    this.particleConfig = config;
  }
  
  updateParticles() {
    if (!this.particles || !this.particleConfig) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    for (let i = 0; i < this.particleConfig.count; i++) {
      this.particles.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      
      // Update position
      position.y -= this.particleConfig.speed * 0.016; // Assuming 60fps
      
      // Reset if below ground
      if (position.y < -2) {
        position.y = 20;
        position.x = Math.random() * 40 - 20;
        position.z = Math.random() * 40 - 20;
      }
      
      matrix.compose(position, quaternion, scale);
      this.particles.setMatrixAt(i, matrix);
    }
    
    this.particles.instanceMatrix.needsUpdate = true;
  }
  
  setWeather(weatherName) {
    const effect = WEATHER_EFFECTS[weatherName];
    if (!effect) return;
    
    // Update lighting
    this.scene.traverse((object) => {
      if (object.isLight) {
        if (object.type === 'DirectionalLight') {
          object.intensity = effect.sunIntensity;
        } else if (object.type === 'AmbientLight') {
          object.intensity = effect.ambientIntensity;
        }
      }
    });
    
    // Update fog
    if (this.scene.fog) {
      this.scene.fog.density = effect.fogDensity;
      if (effect.fogColor) {
        this.scene.fog.color.setHex(effect.fogColor);
      }
    }
    
    // Update particles
    if (effect.particles) {
      this.createParticles(effect.particles);
    } else if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }
    
    // Handle lightning
    if (effect.lightning) {
      this.setupLightning(effect.lightning);
    } else {
      this.removeLightning();
    }
  }
  
  setupLightning(config) {
    if (!this.lightningLight) {
      this.lightningLight = new THREE.PointLight(0xffffff, 0, 100);
      this.lightningLight.position.set(0, 20, -10);
      this.scene.add(this.lightningLight);
    }
    
    // Start lightning loop
    const tryLightning = () => {
      if (Math.random() < config.probability) {
        this.lightningLight.intensity = config.intensity;
        
        if (this.lightningTimeout) {
          clearTimeout(this.lightningTimeout);
        }
        
        this.lightningTimeout = setTimeout(() => {
          this.lightningLight.intensity = 0;
        }, config.duration);
      }
      
      requestAnimationFrame(tryLightning);
    };
    
    tryLightning();
  }
  
  removeLightning() {
    if (this.lightningLight) {
      this.scene.remove(this.lightningLight);
      this.lightningLight = null;
    }
    if (this.lightningTimeout) {
      clearTimeout(this.lightningTimeout);
      this.lightningTimeout = null;
    }
  }
  
  update() {
    this.updateParticles();
  }
  
  dispose() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
    this.removeLightning();
  }
}

// ... existing Scene3D class ...

setScenery(sceneryName) {
  if (!SCENERY_CONFIGS[sceneryName]) return;
  
  const config = SCENERY_CONFIGS[sceneryName];
  this.currentScenery = sceneryName;
  
  // Remove existing terrain
  this.scene.traverse((object) => {
    if (object.isMesh && !this.tentFrame.walls.includes(object)) {
      this.scene.remove(object);
    }
  });
  
  // Create new voxel terrain
  const terrain = VoxelUtils.createTerrainMesh({
    color: config.terrainColor,
    ...config.voxel
  });
  this.scene.add(terrain);
  
  // Add water if enabled
  if (config.voxel.waterLevel !== undefined) {
    const water = VoxelUtils.createWaterMesh({
      waterColor: config.voxel.waterColor,
      waterLevel: config.voxel.waterLevel,
      gridSize: 40
    });
    this.scene.add(water);
  }
  
  // Add special features
  if (config.voxel.lava) {
    this.addLavaEffect(config.voxel);
  }
  
  // Update fog
  this.scene.fog.color.setHex(config.fogColor);
  this.scene.fog.density = config.fogDensity;
}

addLavaEffect(config) {
  const lavaLight = new THREE.PointLight(config.lavaColor, 2, 20);
  lavaLight.position.set(0, -2, -5);
  this.scene.add(lavaLight);
  
  // Animate lava light
  const animate = () => {
    lavaLight.intensity = 1.5 + Math.sin(Date.now() * 0.002) * 0.5;
    requestAnimationFrame(animate);
  };
  animate();
}

// ... rest of the code ... 