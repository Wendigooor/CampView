import * as THREE from 'three';

class Graphics {
  constructor(container) {
    this.container = container;
    this.isVoxel = false;
    
    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    this.renderer.domElement.className = 'canvas-container';
    this.container.appendChild(this.renderer.domElement);

    // Hide Three.js canvas initially
    this.renderer.domElement.style.display = 'none';

    // Camera position
    this.camera.position.z = 5;
    this.camera.position.y = 2;
    this.camera.lookAt(0, 0, 0);

    // Basic voxel scene setup
    this.setupVoxelScene();

    // Handle window resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Performance monitoring
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsUpdateInterval = 1000; // Update FPS every second
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setupVoxelScene() {
    // Ground - using merged geometry for better performance
    const groundGeometry = new THREE.BoxGeometry(10, 0.1, 10);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    this.scene.add(ground);

    // Add some basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Store voxel objects for later manipulation
    this.voxelObjects = {
      ground,
      trees: [],
      water: null
    };

    // Create reusable geometries and materials
    this.sharedGeometries = {
      trunk: new THREE.BoxGeometry(0.4, 1.5, 0.4),
      leaves: new THREE.BoxGeometry(1, 1, 1),
      water: new THREE.BoxGeometry(8, 0.1, 6)
    };

    this.sharedMaterials = {
      trunk: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      leaves: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
      water: new THREE.MeshPhongMaterial({
        color: 0x4A90E2,
        transparent: true,
        opacity: 0.8
      })
    };
  }

  setVoxelScene(sceneName) {
    // Clear existing voxel objects except ground
    this.voxelObjects.trees.forEach(tree => this.scene.remove(tree));
    this.voxelObjects.trees = [];
    if (this.voxelObjects.water) {
      this.scene.remove(this.voxelObjects.water);
      this.voxelObjects.water = null;
    }

    switch (sceneName) {
      case 'lake':
        this.createVoxelLake();
        break;
      case 'mountains':
        this.createVoxelMountains();
        break;
      // Add more scene types here
      default:
        this.createVoxelLake(); // Default to lake scene
    }
  }

  createVoxelLake() {
    // Create water surface using shared geometry and material
    const water = new THREE.Mesh(this.sharedGeometries.water, this.sharedMaterials.water);
    water.position.set(0, -0.2, -2);
    this.scene.add(water);
    this.voxelObjects.water = water;

    // Add trees around the lake
    for (let i = 0; i < 5; i++) {
      const tree = this.createVoxelTree();
      const angle = (i / 5) * Math.PI * 2;
      tree.position.set(
        Math.cos(angle) * 4,
        0,
        Math.sin(angle) * 4
      );
      this.scene.add(tree);
      this.voxelObjects.trees.push(tree);
    }
  }

  createVoxelTree() {
    const group = new THREE.Group();

    // Tree trunk using shared geometry and material
    const trunk = new THREE.Mesh(this.sharedGeometries.trunk, this.sharedMaterials.trunk);
    trunk.position.y = 0.75;
    group.add(trunk);

    // Tree leaves using shared geometry and material
    for (let y = 0; y < 2; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (Math.random() > 0.3) { // Random gaps in the leaves
            const leaf = new THREE.Mesh(this.sharedGeometries.leaves, this.sharedMaterials.leaves);
            leaf.position.set(x * 0.8, y * 0.8 + 1.5, z * 0.8);
            leaf.scale.set(0.8, 0.8, 0.8);
            group.add(leaf);
          }
        }
      }
    }

    return group;
  }

  createVoxelMountains() {
    // Create mountain peaks
    const mountainGeometry = new THREE.ConeGeometry(1, 2, 4);
    const mountainMaterial = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });

    for (let i = 0; i < 3; i++) {
      const height = 2 + Math.random() * 2;
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      mountain.scale.y = height;
      
      mountain.position.set(
        (i - 1) * 2,
        height / 2 - 0.5,
        -3
      );
      this.scene.add(mountain);
      this.voxelObjects.trees.push(mountain); // Reuse trees array for cleanup
    }
  }

  toggleStyle() {
    this.isVoxel = !this.isVoxel;
    this.renderer.domElement.style.display = this.isVoxel ? 'block' : 'none';
  }

  update() {
    if (this.isVoxel) {
      const currentTime = performance.now();
      
      // Rotate camera slightly for dynamic view
      const time = currentTime * 0.001;
      this.camera.position.x = Math.cos(time * 0.1) * 5;
      this.camera.position.z = Math.sin(time * 0.1) * 5;
      this.camera.lookAt(0, 0, 0);
      
      this.renderer.render(this.scene, this.camera);

      // FPS monitoring
      this.frameCount++;
      if (currentTime > this.lastTime + this.fpsUpdateInterval) {
        const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        console.debug(`Current FPS: ${fps}`);
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
    }
  }

  dispose() {
    // Clean up Three.js resources
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (object.material.map) {
          object.material.map.dispose();
        }
        object.material.dispose();
      }
    });

    // Dispose of shared resources
    Object.values(this.sharedGeometries).forEach(geometry => geometry.dispose());
    Object.values(this.sharedMaterials).forEach(material => material.dispose());

    this.renderer.dispose();
    window.removeEventListener('resize', this.handleResize);
  }
}

export function initGraphics(container) {
  return new Graphics(container);
} 