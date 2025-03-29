export function initTent(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'absolute inset-0 w-full h-full z-10';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  const colors = {
    tentFrame: '#D6A65B',      // Warm tent color from spec
    tentShadow: '#B48D4B',     // Darker tent frame
    tentHighlight: '#E6B76B',  // Lighter tent frame
    stitching: '#8B7355',      // Darker stitching
    shadow: 'rgba(0, 0, 0, 0.35)',
    highlight: 'rgba(255, 255, 255, 0.15)',
    meshOverlay: 'rgba(139, 115, 85, 0.1)' // Subtle mesh texture
  };
  
  // Noise texture for fabric detail
  const noiseCanvas = document.createElement('canvas');
  const noiseCtx = noiseCanvas.getContext('2d');
  
  function createNoiseTexture() {
    noiseCanvas.width = 512;
    noiseCanvas.height = 512;
    const imageData = noiseCtx.createImageData(512, 512);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 15 + 240;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 8; // Very subtle noise
    }
    
    noiseCtx.putImageData(imageData, 0, 0);
  }
  
  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    createNoiseTexture();
    draw();
  }
  
  let time = 0;
  const waveSpeed = 0.0005; // Very slow movement
  const waveAmplitude = 1; // Subtle movement
  
  function drawTentFrame() {
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate control points for the curved tent frame
    const framePoints = {
      leftTop: { x: width * 0.15, y: height * 0.167 },
      rightTop: { x: width * 0.85, y: height * 0.167 },
      leftBottom: { x: width * 0.05, y: height * 0.667 },
      rightBottom: { x: width * 0.95, y: height * 0.667 },
      topCenter: { x: width * 0.5, y: 0 },
      bottomCenter: { x: width * 0.5, y: height * 0.917 }
    };
    
    // Draw the tent frame background
    ctx.save();
    
    // Create tent frame path
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    // Create the window opening
    ctx.moveTo(framePoints.leftTop.x, framePoints.leftTop.y);
    ctx.quadraticCurveTo(framePoints.topCenter.x, framePoints.topCenter.y, framePoints.rightTop.x, framePoints.rightTop.y);
    ctx.quadraticCurveTo(framePoints.rightBottom.x, height * 0.4, framePoints.rightBottom.x, framePoints.rightBottom.y);
    ctx.quadraticCurveTo(framePoints.bottomCenter.x, framePoints.bottomCenter.y, framePoints.leftBottom.x, framePoints.leftBottom.y);
    ctx.quadraticCurveTo(framePoints.leftBottom.x, height * 0.4, framePoints.leftTop.x, framePoints.leftTop.y);
    
    // Fill the tent frame
    ctx.fillStyle = colors.tentFrame;
    ctx.fill('evenodd');
    
    // Add noise texture to the frame
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(noiseCanvas, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    
    // Add mesh texture
    const meshSpacing = 30;
    ctx.strokeStyle = colors.meshOverlay;
    ctx.lineWidth = 0.5;
    
    // Horizontal mesh lines
    for (let y = 0; y < height; y += meshSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical mesh lines
    for (let x = 0; x < width; x += meshSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Add seams
    ctx.strokeStyle = colors.stitching;
    ctx.lineWidth = 2;
    
    // Draw curved seams following the tent shape
    ctx.beginPath();
    ctx.moveTo(framePoints.leftTop.x + 20, framePoints.leftTop.y);
    ctx.quadraticCurveTo(framePoints.topCenter.x, framePoints.topCenter.y + 20, framePoints.rightTop.x - 20, framePoints.rightTop.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(framePoints.leftBottom.x + 20, framePoints.leftBottom.y);
    ctx.quadraticCurveTo(framePoints.bottomCenter.x, framePoints.bottomCenter.y - 20, framePoints.rightBottom.x - 20, framePoints.rightBottom.y);
    ctx.stroke();
    
    // Add inner shadow
    const shadowGradient = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.min(width, height) * 0.2,
      width * 0.5, height * 0.5, Math.min(width, height) * 0.6
    );
    shadowGradient.addColorStop(0, 'transparent');
    shadowGradient.addColorStop(1, colors.shadow);
    
    ctx.fillStyle = shadowGradient;
    ctx.fill('evenodd');
    
    // Add subtle highlights
    const time = Date.now() * 0.001;
    const highlightPos = {
      x: width * 0.5 + Math.sin(time * 0.5) * 50,
      y: height * 0.3 + Math.cos(time * 0.3) * 30
    };
    
    const highlightGradient = ctx.createRadialGradient(
      highlightPos.x, highlightPos.y, 0,
      highlightPos.x, highlightPos.y, 200
    );
    highlightGradient.addColorStop(0, colors.highlight);
    highlightGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = highlightGradient;
    ctx.fill('evenodd');
    
    ctx.restore();
    
    // Return the clipping path for the viewport
    return {
      clip: () => {
        ctx.beginPath();
        ctx.moveTo(framePoints.leftTop.x, framePoints.leftTop.y);
        ctx.quadraticCurveTo(framePoints.topCenter.x, framePoints.topCenter.y, framePoints.rightTop.x, framePoints.rightTop.y);
        ctx.quadraticCurveTo(framePoints.rightBottom.x, height * 0.4, framePoints.rightBottom.x, framePoints.rightBottom.y);
        ctx.quadraticCurveTo(framePoints.bottomCenter.x, framePoints.bottomCenter.y, framePoints.leftBottom.x, framePoints.leftBottom.y);
        ctx.quadraticCurveTo(framePoints.leftBottom.x, height * 0.4, framePoints.leftTop.x, framePoints.leftTop.y);
        ctx.clip();
      }
    };
  }
  
  function draw() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the tent frame and get the clipping path
    const viewport = drawTentFrame();
    
    // The clipping path can be used by other layers to draw within the tent opening
    return viewport;
  }
  
  // Initial setup
  createNoiseTexture();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  return {
    update: draw,
    resizeCanvas,
    dispose: () => {
      window.removeEventListener('resize', resizeCanvas);
    }
  };
} 