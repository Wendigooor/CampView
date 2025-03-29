import * as THREE from 'three';

export class TentFrame {
  constructor(scene) {
    this.scene = scene;
    this.createTentWalls();
    this.createAmbientLight();
  }

  createTentWalls() {
    // Create tent material with fabric texture
    const tentMaterial = new THREE.MeshStandardMaterial({
      color: 0xD6A65B,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 3),
      tentMaterial
    );
    leftWall.position.set(-2, 1.5, -1);
    leftWall.rotation.y = Math.PI / 4;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 3),
      tentMaterial
    );
    rightWall.position.set(2, 1.5, -1);
    rightWall.rotation.y = -Math.PI / 4;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 3),
      tentMaterial
    );
    backWall.position.set(0, 1.5, -2);
    backWall.rotation.y = Math.PI;
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Top cover (triangular)
    const topGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -2, 3, -1,  // top left
      2, 3, -1,   // top right
      0, 1.5, -2, // bottom center
    ]);
    const indices = new Uint16Array([0, 1, 2]);
    topGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    topGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    topGeometry.computeVertexNormals();

    const topCover = new THREE.Mesh(topGeometry, tentMaterial);
    topCover.receiveShadow = true;
    this.scene.add(topCover);

    // Floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.0
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      floorMaterial
    );
    floor.position.set(0, 0, -1);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Store references
    this.walls = [leftWall, rightWall, backWall, topCover, floor];
  }

  createAmbientLight() {
    // Warm ambient light inside tent
    this.tentLight = new THREE.PointLight(0xFFE4B5, 0.5, 5);
    this.tentLight.position.set(0, 2, -1);
    this.scene.add(this.tentLight);

    // Add subtle rim light
    this.rimLight = new THREE.SpotLight(0xFFF0E0, 0.3);
    this.rimLight.position.set(0, 3, -2);
    this.rimLight.target.position.set(0, 0, -1);
    this.scene.add(this.rimLight);
    this.scene.add(this.rimLight.target);
  }

  update(time) {
    // Subtle tent fabric movement
    if (this.walls) {
      this.walls.forEach((wall, i) => {
        if (wall.isMesh) {
          wall.position.y += Math.sin(time * 0.5 + i) * 0.0001;
        }
      });
    }

    // Animate tent light
    if (this.tentLight) {
      this.tentLight.intensity = 0.5 + Math.sin(time * 0.5) * 0.05;
    }
  }

  dispose() {
    this.walls.forEach(wall => {
      if (wall.isMesh) {
        wall.geometry.dispose();
        wall.material.dispose();
      }
    });
    this.scene.remove(this.tentLight);
    this.scene.remove(this.rimLight);
  }
} 