import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Water } from 'three/examples/jsm/objects/Water';

// Custom voxel shader
const VoxelShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'resolution': { value: new THREE.Vector2() },
    'pixelSize': { value: 8.0 }
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
    uniform vec2 resolution;
    uniform float pixelSize;
    varying vec2 vUv;
    
    void main() {
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy);
      gl_FragColor = texture2D(tDiffuse, coord);
    }
  `
};

export class Scene3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    
    // Setup camera with better positioning
    this.camera = new THREE.PerspectiveCamera(
      65, // Wider FOV for better immersion
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 2;
    this.camera.position.y = 1.6; // Eye level
    this.camera.lookAt(0, 1.6, -10);
    
    // Setup renderer with improved settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
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
    
    // Setup post-processing with enhanced bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8, // Stronger bloom
      0.3, // Smaller radius
      0.9 // Higher threshold
    );
    this.composer.addPass(bloomPass);
    
    // Add voxel effect pass
    this.voxelPass = new ShaderPass(VoxelShader);
    this.voxelPass.uniforms.resolution.value.set(container.clientWidth, container.clientHeight);
    this.voxelPass.enabled = false;
    this.composer.addPass(this.voxelPass);
    
    // Setup scene elements
    this.setupLights();
    this.setupEnvironment();
    this.setupTentMask();
    this.setupCampfire();
    
    // Animation
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    
    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
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
        metalness: 0.1,
        wireframe: false
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
    
    // Try to add water
    try {
      const waterGeometry = new THREE.PlaneGeometry(100, 100);
      const textureLoader = new THREE.TextureLoader();
      
      // Load water normals texture with proper error handling
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
        sunDirection: new THREE.Vector3(),
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
  
  setupTentMask() {
    // Create tent frame geometry
    const shape = new THREE.Shape();
    
    // Calculate dimensions based on screen aspect ratio
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspectRatio = width / height;
    
    const shapeWidth = 10 * aspectRatio;
    const shapeHeight = 10;
    
    // Create tent opening shape
    shape.moveTo(-shapeWidth/2, -shapeHeight/2);
    shape.quadraticCurveTo(0, -shapeHeight/2 - 1, shapeWidth/2, -shapeHeight/2);
    shape.quadraticCurveTo(shapeWidth/2 + 1, 0, shapeWidth/2, shapeHeight/2);
    shape.quadraticCurveTo(0, shapeHeight/2 + 1, -shapeWidth/2, shapeHeight/2);
    shape.quadraticCurveTo(-shapeWidth/2 - 1, 0, -shapeWidth/2, -shapeHeight/2);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
      color: 0xD6A65B,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    this.tentFrame = new THREE.Mesh(geometry, material);
    this.tentFrame.position.z = -3;
    this.scene.add(this.tentFrame);
  }
  
  setupCampfire() {
    // Create campfire light
    this.fireLight = new THREE.PointLight(0xff6600, 2, 10);
    this.fireLight.position.set(0, 0, 2);
    this.scene.add(this.fireLight);
    
    // Create particle system for fire
    const fireGeometry = new THREE.BufferGeometry();
    const fireParticles = 100;
    const positions = new Float32Array(fireParticles * 3);
    const colors = new Float32Array(fireParticles * 3);
    
    for (let i = 0; i < fireParticles * 3; i += 3) {
      positions[i] = Math.random() * 0.5 - 0.25;
      positions[i + 1] = Math.random() * 1;
      positions[i + 2] = Math.random() * 0.5 - 0.25 + 2;
      
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
      opacity: 0.8
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
    
    if (this.voxelPass) {
      this.voxelPass.uniforms.resolution.value.set(width, height);
    }
  }
  
  animate() {
    requestAnimationFrame(this.animate);
    
    const time = this.clock.getElapsedTime();
    
    // Animate tent frame
    if (this.tentFrame) {
      this.tentFrame.rotation.z = Math.sin(time * 0.5) * 0.02;
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
} 