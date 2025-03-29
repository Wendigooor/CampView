class UI {
  constructor(container) {
    this.container = container;
    this.createUI();
  }

  createUI() {
    const uiContainer = document.createElement('div');
    uiContainer.className = 'ui-controls';
    
    // Weather dropdown
    const weatherSelect = document.createElement('select');
    weatherSelect.className = 'bg-gray-800 text-white p-2 rounded mb-2 w-full';
    weatherSelect.innerHTML = `
      <option value="clear">Clear</option>
      <option value="rain">Light Rain</option>
      <option value="fog">Fog</option>
      <option value="thunderstorm">Thunderstorm</option>
      <option value="snow">Snow</option>
    `;
    weatherSelect.addEventListener('change', (e) => {
      window.dispatchEvent(new CustomEvent('weatherChange', {
        detail: { weather: e.target.value }
      }));
    });

    // Scenery dropdown
    const scenerySelect = document.createElement('select');
    scenerySelect.className = 'bg-gray-800 text-white p-2 rounded mb-2 w-full';
    scenerySelect.innerHTML = `
      <option value="lake">Lake</option>
      <option value="mountains">Mountains</option>
      <option value="city">Distant City</option>
      <option value="ocean">Ocean</option>
      <option value="forest">Forest</option>
      <option value="desert">Desert</option>
      <option value="plains">Plains</option>
      <option value="volcano">Volcano</option>
      <option value="tundra">Snowy Tundra</option>
      <option value="jungle">Jungle</option>
    `;
    scenerySelect.addEventListener('change', (e) => {
      window.dispatchEvent(new CustomEvent('sceneryChange', {
        detail: { scenery: e.target.value }
      }));
    });

    // Graphics style toggle
    const styleToggle = document.createElement('button');
    styleToggle.className = 'bg-gray-800 text-white p-2 rounded mb-2 w-full hover:bg-gray-700 transition-colors';
    styleToggle.textContent = 'Toggle Voxel Style';
    styleToggle.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('styleToggle'));
    });

    // Random event trigger
    const randomEventBtn = document.createElement('button');
    randomEventBtn.className = 'bg-gray-800 text-white p-2 rounded w-full hover:bg-gray-700 transition-colors';
    randomEventBtn.textContent = 'Trigger Random Event';
    randomEventBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('triggerRandomEvent'));
    });

    // Add elements to UI container
    uiContainer.appendChild(this.createLabel('Weather:'));
    uiContainer.appendChild(weatherSelect);
    uiContainer.appendChild(this.createLabel('Scenery:'));
    uiContainer.appendChild(scenerySelect);
    uiContainer.appendChild(document.createElement('br'));
    uiContainer.appendChild(styleToggle);
    uiContainer.appendChild(document.createElement('br'));
    uiContainer.appendChild(randomEventBtn);

    // Add tent frame overlay
    const tentFrame = document.createElement('div');
    tentFrame.className = 'absolute inset-0 pointer-events-none';
    tentFrame.style.background = 'url(/tent-frame.svg) no-repeat center center';
    tentFrame.style.backgroundSize = 'contain';
    
    this.container.appendChild(uiContainer);
    this.container.appendChild(tentFrame);
  }

  createLabel(text) {
    const label = document.createElement('div');
    label.className = 'text-white mb-1 font-medium';
    label.textContent = text;
    return label;
  }
}

export function initUI(container) {
  return new UI(container);
} 