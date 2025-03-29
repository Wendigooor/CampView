export class Controls {
  constructor(container, scene3D) {
    this.scene3D = scene3D;
    this.container = container;
    
    this.createControlPanel();
  }
  
  createControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'absolute bottom-4 right-4 bg-black/50 p-4 rounded-lg text-white';
    
    // Mode switch
    const modeSwitch = document.createElement('div');
    modeSwitch.className = 'flex items-center gap-2';
    
    const label = document.createElement('label');
    label.className = 'text-sm font-medium';
    label.textContent = 'Voxel Mode';
    
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'w-4 h-4';
    toggle.addEventListener('change', (e) => {
      this.toggleVoxelMode(e.target.checked);
    });
    
    modeSwitch.appendChild(label);
    modeSwitch.appendChild(toggle);
    panel.appendChild(modeSwitch);
    
    this.container.appendChild(panel);
  }
  
  toggleVoxelMode(enabled) {
    if (!this.scene3D) return;
    
    if (enabled) {
      // Apply voxel effect
      this.scene3D.enableVoxelMode();
    } else {
      // Remove voxel effect
      this.scene3D.disableVoxelMode();
    }
  }
  
  dispose() {
    if (this.container.lastChild) {
      this.container.removeChild(this.container.lastChild);
    }
  }
} 