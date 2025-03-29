import './style.css'
import { initScene } from './scene.js'
import { initWeather } from './weather.js'
import { initEvents } from './events.js'
import { initGraphics } from './graphics.js'
import { initUI } from './ui.js'
import { initTent } from './tent.js'
import { Scene3D } from './components/Scene3D'
import { Controls } from './components/Controls'

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Create canvas container
    const container = document.createElement('div')
    container.id = 'tent-view'
    container.className = 'relative w-full h-screen bg-black'
    document.body.appendChild(container)

    // Initialize systems in order of rendering (back to front)
    const systems = {}

    // Background layer (z-index: 1)
    systems.scene = initScene(container)
    
    // Weather effects layer (z-index: 2)
    systems.weather = initWeather(container)
    
    // Tent layer (z-index: 3)
    systems.tent = initTent(container)
    
    // Events layer (z-index: 4)
    systems.events = initEvents(container)
    
    // Graphics effects layer (z-index: 5)
    systems.graphics = initGraphics(container)
    
    // UI layer (z-index: 10)
    systems.ui = initUI(container)

    // Initialize 3D scene
    const scene = new Scene3D(container)
    
    // Add controls
    const controls = new Controls(container, scene)
    
    // Start animation
    scene.start()

    // Event handlers
    const eventHandlers = {
      weatherChange: (e) => systems.weather?.setWeather(e.detail.weather),
      sceneryChange: (e) => {
        systems.scene?.setScene(e.detail.scenery)
        if (systems.graphics?.isVoxel) {
          systems.graphics.setVoxelScene(e.detail.scenery)
        }
      },
      styleToggle: () => {
        if (systems.graphics) {
          systems.graphics.toggleStyle()
          if (systems.graphics.isVoxel) {
            systems.graphics.setVoxelScene(systems.scene?.currentScene)
          }
        }
      },
      triggerRandomEvent: () => systems.events?.triggerRandomEvent()
    }

    // Add event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler)
    })

    // Animation frame ID for cleanup
    let animationFrameId

    // Animation loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      
      // Update all systems in order
      if (systems.scene?.update) systems.scene.update()
      if (systems.weather?.update) systems.weather.update()
      if (systems.tent?.update) systems.tent.update()
      if (systems.events?.update) systems.events.update()
      if (systems.graphics?.update) systems.graphics.update()
      if (systems.ui?.update) systems.ui.update()
    }

    animate()

    // Cleanup function
    function cleanup() {
      // Remove event listeners
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler)
      })

      // Cancel animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      // Remove container
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }

      // Cleanup systems
      Object.values(systems).forEach(system => {
        if (system?.dispose) {
          try {
            system.dispose()
          } catch (error) {
            console.error(`Error disposing system:`, error)
          }
        }
      })

      // Dispose 3D scene and controls
      scene.dispose()
      controls.dispose()
    }

    // Handle cleanup on page unload
    window.addEventListener('unload', cleanup)
  } catch (error) {
    console.error('Error initializing application:', error)
  }
})

export function initApp(container) {
  // Initialize 3D scene
  const scene = new Scene3D(container)
  
  // Add controls
  const controls = new Controls(container, scene)
  
  // Start animation
  scene.start()
  
  // Return cleanup function
  return () => {
    scene.dispose()
    controls.dispose()
  }
}
