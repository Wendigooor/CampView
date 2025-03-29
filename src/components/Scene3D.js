import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Water } from 'three/examples/jsm/objects/Water';
import { TentFrame } from './TentFrame';

// Tent mask shader with fixed triangle shape
const TentMaskShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'uAspect': { value: 1.0 }
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
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 pos = (uv - center) * vec2(uAspect, 1.0);
      
      // Fixed triangle shape
      float tentShape = 1.0 - smoothstep(0.0, 0.05,
        max(
          abs(pos.x) * 1.2 - (1.0 - pos.y) * 0.6, // Side edges
          pos.y * 1.2 - 0.2 // Bottom edge
        )
      );
      
      // Add subtle fabric texture
      float fabric = sin(pos.x * 200.0) * sin(pos.y * 200.0) * 0.01;
      
      // Get scene color
      vec4 sceneColor = texture2D(tDiffuse, uv);
      
      // Darken edges with warm tent color
      vec3 tentColor = mix(
        vec3(0.05, 0.03, 0.02), // Very dark edge
        vec3(0.35, 0.25, 0.2), // Lighter inner edge
        smoothstep(0.3, 0.7, tentShape + fabric)
      );
      
      // Mix scene with tent edges
      gl_FragColor = vec4(
        mix(tentColor, sceneColor.rgb, smoothstep(0.3, 0.7, tentShape)),
        1.0
      );
    }
  `
};

// Weather shader
const WeatherShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'uTime': { value: 0.0 },
    'uRainIntensity': { value: 0.0 },
    'uSnowIntensity': { value: 0.0 },
    'uFogIntensity': { value: 0.0 },
    'uNightIntensity': { value: 0.0 }
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
    uniform float uTime;
    uniform float uRainIntensity;
    uniform float uSnowIntensity;
    uniform float uFogIntensity;
    uniform float uNightIntensity;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    vec3 applyRain(vec3 color, vec2 uv) {
      vec2 pos = uv * vec2(30.0, 20.0) + vec2(uTime * 2.0, uTime * 15.0);
      float rain = step(0.95, random(floor(pos)));
      return mix(color, vec3(0.8, 0.8, 1.0), rain * uRainIntensity * 0.3);
    }

    vec3 applySnow(vec3 color, vec2 uv) {
      vec2 pos = uv * vec2(20.0) + vec2(uTime * 0.5, uTime);
      float snow = step(0.97, random(floor(pos)));
      return mix(color, vec3(1.0), snow * uSnowIntensity * 0.5);
    }

    vec3 applyFog(vec3 color, vec2 uv) {
      vec3 fogColor = vec3(0.7, 0.7, 0.8);
      float fogFactor = smoothstep(0.3, 1.0, length(uv - vec2(0.5)));
      return mix(color, fogColor, fogFactor * uFogIntensity);
    }

    vec3 applyNight(vec3 color) {
      vec3 nightColor = color * 0.2;
      return mix(color, nightColor, uNightIntensity);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;
      
      // Apply weather effects in sequence
      if (uRainIntensity > 0.0) color = applyRain(color, vUv);
      if (uSnowIntensity > 0.0) color = applySnow(color, vUv);
      if (uFogIntensity > 0.0) color = applyFog(color, vUv);
      if (uNightIntensity > 0.0) color = applyNight(color);
      
      gl_FragColor = vec4(color, texel.a);
    }
  `
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
    rainIntensity: 1.0
  },
  Snow: {
    sunIntensity: 1.0,
    fogDensity: 0.02,
    ambientIntensity: 0.7,
    snowIntensity: 1.0
  },
  Fog: {
    sunIntensity: 0.3,
    fogDensity: 0.05,
    ambientIntensity: 0.4,
    fogIntensity: 1.0
  },
  Night: {
    sunIntensity: 0.1,
    fogDensity: 0.02,
    ambientIntensity: 0.2,
    nightIntensity: 1.0
  },
  Storm: {
    sunIntensity: 0.2,
    fogDensity: 0.04,
    ambientIntensity: 0.3,
    rainIntensity: 1.0,
    lightningEnabled: true
  }
};

// Random events
const RANDOM_EVENTS = {
  UFO: {
    duration: 5000,
    setup: (scene) => {
      const ufoLight = new THREE.PointLight(0x00ff00, 2, 20);
      ufoLight.position.set(0, 10, -5);
      scene.add(ufoLight);
      return ufoLight;
    },
    animate: (obj, time) => {
      obj.position.x = Math.sin(time) * 5;
      obj.position.z = Math.cos(time) * 5 - 5;
      obj.intensity = 1.5 + Math.sin(time * 2) * 0.5;
    },
    cleanup: (obj, scene) => {
      scene.remove(obj);
    }
  },
  Birds: {
    duration: 8000,
    setup: (scene) => {
      const birds = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const bird = new THREE.Mesh(
          new THREE.ConeGeometry(0.1, 0.3),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        bird.position.set(
          Math.random() * 10 - 5,
          Math.random() * 2 + 3,
          -10
        );
        birds.add(bird);
      }
      scene.add(birds);
      return birds;
    },
    animate: (obj, time) => {
      obj.children.forEach((bird, i) => {
        bird.position.x += Math.sin(time + i) * 0.02;
        bird.position.y += Math.cos(time + i) * 0.01;
        bird.position.z += 0.05;
        if (bird.position.z > 5) bird.position.z = -10;
      });
    },
    cleanup: (obj, scene) => {
      scene.remove(obj);
    }
  }
};

// Scenery configurations
const SCENERY_CONFIGS = {
  Lake: {
    hdri: '/assets/hdri/lake_1k.hdr',
    waterEnabled: true,
    terrainColor: 0x2D5A27,
    fogColor: 0xb1c4dd,
    fogDensity: 0.015
  },
  Mountains: {
    hdri: '/assets/hdri/mountains_1k.hdr',
    waterEnabled: false,
    terrainColor: 0x4A4A4A,
    fogColor: 0xC8D1E0,
    fogDensity: 0.02
  },
  Forest: {
    hdri: '/assets/hdri/forest_1k.hdr',
    waterEnabled: false,
    terrainColor: 0x1B4D2E,
    fogColor: 0xA3B18A,
    fogDensity: 0.025
  },
  Desert: {
    hdri: '/assets/hdri/desert_1k.hdr',
    waterEnabled: false,
    terrainColor: 0xD4B483,
    fogColor: 0xF4D03F,
    fogDensity: 0.01
  },
  Ocean: {
    hdri: '/assets/hdri/ocean_1k.hdr',
    waterEnabled: true,
    terrainColor: 0x1B4F72,
    fogColor: 0x85C1E9,
    fogDensity: 0.02
  },
  City: {
    hdri: '/assets/hdri/city_1k.hdr',
    waterEnabled: false,
    terrainColor: 0x2C3E50,
    fogColor: 0xD5D8DC,
    fogDensity: 0.03
  },
  Glacier: {
    hdri: '/assets/hdri/glacier_1k.hdr',
    waterEnabled: true,
    terrainColor: 0xD6EAF8,
    fogColor: 0xEBF5FB,
    fogDensity: 0.02
  },
  Valley: {
    hdri: '/assets/hdri/valley_1k.hdr',
    waterEnabled: false,
    terrainColor: 0x196F3D,
    fogColor: 0xA9DFBF,
    fogDensity: 0.02
  },
  Volcano: {
    hdri: '/assets/hdri/volcano_1k.hdr',
    waterEnabled: false,
    terrainColor: 0x943126,
    fogColor: 0xE6B0AA,
    fogDensity: 0.03
  },
  Fantasy: {
    hdri: '/assets/hdri/fantasy_1k.hdr',
    waterEnabled: true,
    terrainColor: 0x8E44AD,
    fogColor: 0xD2B4DE,
    fogDensity: 0.02
  }
};

export class Scene3D {
  constructor(container) {
    this.container = container;
    this.currentScenery = 'Lake';
    this.currentWeather = 'Clear';
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 0;
    this.camera.position.y = 1.6;
    this.camera.lookAt(0, 1.6, -10);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(this.renderer.domElement);
    
    // Setup post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    
    // Add bloom
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8,
      0.3,
      0.9
    );
    this.composer.addPass(bloomPass);
    
    // Add weather effects
    this.weatherPass = new ShaderPass(WeatherShader);
    this.composer.addPass(this.weatherPass);
    
    // Add tent mask
    this.tentMaskPass = new ShaderPass(TentMaskShader);
    this.tentMaskPass.uniforms.uAspect.value = container.clientWidth / container.clientHeight;
    this.composer.addPass(this.tentMaskPass);
    
    // Setup scene
    this.setupLights();
    this.loadScenery(this.currentScenery);
    this.setupCampfire();
    
    // Animation
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    
    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Add tent frame
    this.tentFrame = new TentFrame(this.scene);
    
    // Initialize events system
    this.activeEvents = new Map();
  }
  
  async loadScenery(sceneryName) {
    const config = SCENERY_CONFIGS[sceneryName];
    if (!config) return;
    
    this.currentScenery = sceneryName;
    
    // Update fog
    this.scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);
    
    try {
      // Load HDRI
      const rgbeLoader = new RGBELoader();
      const texture = await rgbeLoader.loadAsync(config.hdri);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = texture;
    } catch (error) {
      console.warn('HDRI not found, using fallback sky');
      this.createFallbackSky();
    }
    
    // Update terrain
    if (this.terrain) this.scene.remove(this.terrain);
    this.terrain = this.createTerrain(config);
    this.scene.add(this.terrain);
    
    // Update water
    if (this.water) this.scene.remove(this.water);
    if (config.waterEnabled) {
      this.water = await this.createWater();
      if (this.water) this.scene.add(this.water);
    }
  }
  
  createTerrain(config) {
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200, 100, 100),
      new THREE.MeshStandardMaterial({
        color: config.terrainColor,
        roughness: 0.8,
        metalness: 0.1
      })
    );
    
    const vertices = terrain.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 1] = Math.sin(vertices[i] * 0.05) * Math.cos(vertices[i + 2] * 0.05) * 2;
    }
    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
    
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -2;
    terrain.receiveShadow = true;
    
    return terrain;
  }
  
  setupLights() {
    // Main directional light (sun/moon)
    this.sunLight = new THREE.DirectionalLight(0xffd2a1, 2);
    this.sunLight.position.set(-10, 8, -5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 50;
    this.sunLight.shadow.camera.left = -10;
    this.sunLight.shadow.camera.right = 10;
    this.sunLight.shadow.camera.top = 10;
    this.sunLight.shadow.camera.bottom = -10;
    this.sunLight.shadow.bias = -0.0001;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    
    // Ambient light for soft fill
    const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
    this.scene.add(ambientLight);
    
    // Hemisphere light for sky/ground color interaction
    const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.8);
    this.scene.add(hemiLight);
  }
  
  async setupEnvironment() {
    // Add volumetric fog
    this.scene.fog = new THREE.FogExp2(0xb1c4dd, 0.015);
    
    try {
      // Load HDRI environment
      const rgbeLoader = new RGBELoader();
      const texture = await rgbeLoader.loadAsync('/assets/hdri/forest_slope_1k.hdr');
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = texture;
    } catch (error) {
      console.warn('HDRI not found, using fallback sky');
      // Create gradient sky
      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(500, 32, 32),
        new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
              float h = normalize(vWorldPosition + offset).y;
              gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
          `,
          uniforms: {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
          },
          side: THREE.BackSide
        })
      );
      this.scene.add(sky);
    }
    
    // Create detailed terrain
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200, 100, 100),
      new THREE.MeshStandardMaterial({
        color: 0x2D5A27,
        roughness: 0.8,
        metalness: 0.1
      })
    );
    
    // Add terrain displacement
    const vertices = terrain.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 1] = Math.sin(vertices[i] * 0.05) * Math.cos(vertices[i + 2] * 0.05) * 2;
    }
    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
    
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -2;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    
    // Try to add water with reflection
    try {
      const waterGeometry = new THREE.PlaneGeometry(100, 100);
      const textureLoader = new THREE.TextureLoader();
      
      const waterNormals = await new Promise((resolve, reject) => {
        textureLoader.load(
          '/assets/textures/waternormals.jpg',
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            resolve(texture);
          },
          undefined,
          reject
        );
      });
      
      this.water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: waterNormals,
        sunDirection: this.sunLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: this.scene.fog !== undefined
      });
      
      this.water.rotation.x = -Math.PI / 2;
      this.water.position.y = -1.5;
      this.scene.add(this.water);
    } catch (error) {
      console.warn('Could not load water texture, skipping water feature:', error);
    }
  }
  
  setupCampfire() {
    // Create campfire light
    this.fireLight = new THREE.PointLight(0xff6600, 2, 10);
    this.fireLight.position.set(0, -0.5, -2);
    this.scene.add(this.fireLight);
    
    // Create particle system for fire
    const fireGeometry = new THREE.BufferGeometry();
    const fireParticles = 100;
    const positions = new Float32Array(fireParticles * 3);
    const colors = new Float32Array(fireParticles * 3);
    
    for (let i = 0; i < fireParticles * 3; i += 3) {
      positions[i] = Math.random() * 0.5 - 0.25;
      positions[i + 1] = Math.random() * 1;
      positions[i + 2] = Math.random() * 0.5 - 0.25 - 2;
      
      colors[i] = Math.random() * 0.5 + 0.5;
      colors[i + 1] = Math.random() * 0.3;
      colors[i + 2] = 0.1;
    }
    
    fireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    fireGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const fireMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    
    this.fire = new THREE.Points(fireGeometry, fireMaterial);
    this.scene.add(this.fire);
  }
  
  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    
    if (this.tentMaskPass) {
      this.tentMaskPass.uniforms.uAspect.value = width / height;
    }
  }
  
  animate() {
    requestAnimationFrame(this.animate);
    
    const time = this.clock.getElapsedTime();
    
    // Update tent frame
    if (this.tentFrame) {
      this.tentFrame.update(time);
    }
    
    // Update active events
    this.activeEvents.forEach((activeEvent, eventName) => {
      const eventTime = time - activeEvent.startTime;
      activeEvent.event.animate(activeEvent.object, eventTime);
    });
    
    // Update weather effects
    if (this.weatherPass) {
      this.weatherPass.uniforms.uTime.value = time;
    }
    
    // Animate water
    if (this.water) {
      this.water.material.uniforms['time'].value += 1.0 / 60.0;
    }
    
    // Animate campfire
    if (this.fire && this.fireLight) {
      const positions = this.fire.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + i) * 0.002;
        positions[i + 1] += Math.cos(time + i) * 0.01;
        positions[i + 2] += Math.sin(time + i) * 0.002;
      }
      this.fire.geometry.attributes.position.needsUpdate = true;
      
      this.fireLight.intensity = 1.5 + Math.sin(time * 10) * 0.5;
    }
    
    // Render scene
    this.composer.render();
  }
  
  start() {
    this.animate();
  }
  
  dispose() {
    window.removeEventListener('resize', this.onResize);
    
    // Dispose of Three.js resources
    this.scene.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose();
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    });
    
    this.renderer.dispose();
    this.composer.dispose();
    
    if (this.tentFrame) {
      this.tentFrame.dispose();
    }
    
    this.stopLightning();
    
    this.activeEvents.forEach((activeEvent) => {
      activeEvent.event.cleanup(activeEvent.object, this.scene);
    });
    this.activeEvents.clear();
  }
  
  enableVoxelMode() {
    if (this.voxelPass) {
      this.voxelPass.enabled = true;
      
      this.scene.traverse((object) => {
        if (object.isMesh) {
          if (object.material.map) {
            object.material.map.minFilter = THREE.NearestFilter;
            object.material.map.magFilter = THREE.NearestFilter;
            object.material.map.needsUpdate = true;
          }
          object.material.flatShading = true;
          object.material.needsUpdate = true;
        }
      });
    }
  }
  
  disableVoxelMode() {
    if (this.voxelPass) {
      this.voxelPass.enabled = false;
      
      this.scene.traverse((object) => {
        if (object.isMesh) {
          if (object.material.map) {
            object.material.map.minFilter = THREE.LinearMipmapLinearFilter;
            object.material.map.magFilter = THREE.LinearFilter;
            object.material.map.needsUpdate = true;
          }
          object.material.flatShading = false;
          object.material.needsUpdate = true;
        }
      });
    }
  }
  
  setWeather(weatherName) {
    if (!WEATHER_EFFECTS[weatherName]) return;
    
    const effect = WEATHER_EFFECTS[weatherName];
    this.currentWeather = weatherName;
    
    // Update lighting
    if (this.sunLight) {
      this.sunLight.intensity = effect.sunIntensity;
    }
    
    // Update fog
    if (this.scene.fog) {
      this.scene.fog.density = effect.fogDensity;
    }
    
    // Update weather shader uniforms
    if (this.weatherPass) {
      this.weatherPass.uniforms.uRainIntensity.value = effect.rainIntensity || 0;
      this.weatherPass.uniforms.uSnowIntensity.value = effect.snowIntensity || 0;
      this.weatherPass.uniforms.uFogIntensity.value = effect.fogIntensity || 0;
      this.weatherPass.uniforms.uNightIntensity.value = effect.nightIntensity || 0;
    }
    
    // Handle lightning in storm weather
    if (effect.lightningEnabled) {
      this.startLightning();
    } else {
      this.stopLightning();
    }
  }
  
  startLightning() {
    if (this.lightningInterval) return;
    
    this.lightningLight = new THREE.PointLight(0xffffff, 0, 20);
    this.lightningLight.position.set(0, 10, -5);
    this.scene.add(this.lightningLight);
    
    this.lightningInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        this.lightningLight.intensity = 3.0;
        setTimeout(() => {
          this.lightningLight.intensity = 0;
        }, 150);
      }
    }, 2000);
  }
  
  stopLightning() {
    if (this.lightningInterval) {
      clearInterval(this.lightningInterval);
      this.lightningInterval = null;
    }
    if (this.lightningLight) {
      this.scene.remove(this.lightningLight);
      this.lightningLight = null;
    }
  }
  
  triggerRandomEvent() {
    const events = Object.keys(RANDOM_EVENTS);
    const eventName = events[Math.floor(Math.random() * events.length)];
    this.triggerEvent(eventName);
  }
  
  triggerEvent(eventName) {
    const event = RANDOM_EVENTS[eventName];
    if (!event || this.activeEvents.has(eventName)) return;
    
    const eventObject = event.setup(this.scene);
    this.activeEvents.set(eventName, {
      object: eventObject,
      event: event,
      startTime: this.clock.getElapsedTime()
    });
    
    setTimeout(() => {
      const activeEvent = this.activeEvents.get(eventName);
      if (activeEvent) {
        activeEvent.event.cleanup(activeEvent.object, this.scene);
        this.activeEvents.delete(eventName);
      }
    }, event.duration);
  }
  
  createFallbackSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
        uniforms: {
          topColor: { value: new THREE.Color(0x0077ff) },
          bottomColor: { value: new THREE.Color(0xffffff) },
          offset: { value: 33 },
          exponent: { value: 0.6 }
        },
        side: THREE.BackSide
      })
    );
    this.scene.add(sky);
  }
  
  async createWater() {
    try {
      const waterGeometry = new THREE.PlaneGeometry(100, 100);
      const textureLoader = new THREE.TextureLoader();
      
      const waterNormals = await new Promise((resolve, reject) => {
        textureLoader.load(
          '/assets/textures/waternormals.jpg',
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            resolve(texture);
          },
          undefined,
          (error) => {
            console.warn('Could not load water texture:', error);
            resolve(null); // Resolve with null instead of rejecting
          }
        );
      });
      
      if (!waterNormals) {
        // Create a simple water material if texture loading failed
        return new THREE.Mesh(
          waterGeometry,
          new THREE.MeshStandardMaterial({
            color: 0x001e0f,
            metalness: 0.9,
            roughness: 0.1
          })
        );
      }
      
      const water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: waterNormals,
        sunDirection: this.sunLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: this.scene.fog !== undefined
      });
      
      water.rotation.x = -Math.PI / 2;
      water.position.y = -1.5;
      return water;
    } catch (error) {
      console.warn('Could not create water:', error);
      return null;
    }
  }
  
  setScenery(sceneryName) {
    if (!SCENERY_CONFIGS[sceneryName]) return;
    
    this.currentScenery = sceneryName;
    this.loadScenery(sceneryName);
  }
  
  setVoxelMode(enabled) {
    // Remove existing scene objects except tent and lights
    this.scene.traverse((object) => {
      if (object.isMesh && !this.tentFrame.walls.includes(object)) {
        this.scene.remove(object);
      }
    });
    
    if (enabled) {
      // Create voxel version of current scenery
      const config = SCENERY_CONFIGS[this.currentScenery];
      
      // Create voxel terrain
      const voxelSize = 0.5;
      const gridSize = 40;
      
      const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
      const material = new THREE.MeshStandardMaterial({
        color: config.terrainColor,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const terrain = new THREE.InstancedMesh(geometry, material, gridSize * gridSize);
      
      let count = 0;
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3(1, 1, 1);
      
      for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
          const height = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2;
          position.set(
            (x - gridSize/2) * voxelSize,
            height - 2,
            (z - gridSize/2) * voxelSize
          );
          matrix.compose(position, quaternion, scale);
          terrain.setMatrixAt(count++, matrix);
        }
      }
      
      terrain.receiveShadow = true;
      terrain.castShadow = true;
      this.scene.add(terrain);
      
      // Add voxel water if enabled
      if (config.waterEnabled) {
        const waterMaterial = new THREE.MeshStandardMaterial({
          color: 0x001e0f,
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.8
        });
        
        const waterVoxels = new THREE.InstancedMesh(
          geometry,
          waterMaterial,
          (gridSize/2) * (gridSize/2)
        );
        
        count = 0;
        for (let x = 0; x < gridSize/2; x++) {
          for (let z = 0; z < gridSize/2; z++) {
            position.set(
              (x - gridSize/4) * voxelSize,
              -1.5,
              (z - gridSize/4) * voxelSize
            );
            matrix.compose(position, quaternion, scale);
            waterVoxels.setMatrixAt(count++, matrix);
          }
        }
        
        this.scene.add(waterVoxels);
      }
    } else {
      // Reload normal scenery
      this.loadScenery(this.currentScenery);
    }
  }
} 