Product Requirements Document (PRD)
1. Overview
Project Name: TentView Mini-Game/Splash Screen

Objective: Create an interactive web-based mini-game or splash screen where users can customize a scenic view from inside a tent, including weather, scenery, random events, and graphics style, using Cursor for development. The project will showcase modern coding practices (MCP) to demonstrate technical leadership.

2. Features
Core Features:

View from Tent: The scene is framed by a tent window, mimicking the perspective in the provided image.
Weather Settings (Dropdown or Buttons):
Clear (sunny)
Weak rain
Fog
Thunderstorm
Snow
Scenery Settings (Dropdown or Buttons):
Lake (default, as in the image)
Mountains
Distant city
Ocean
Forest
Desert
Plains
Volcano
Snowy tundra
Jungle
Random Events (Triggered Randomly):
UFO flying across the sky
Flock of birds
Shooting star
Deer or other wildlife passing by
Graphics Style Toggle:
Realistic (using 2D canvas or WebGL for smooth visuals)
Voxel (blocky, Minecraft-like style using Three.js or similar)
User Interface:
Simple UI with dropdowns/buttons for weather, scenery, and graphics style.
A "Randomize" button to trigger random events manually.
Technical Requirements:

Built using JavaScript with a focus on modern frameworks/tools.
Use Cursor for semi-automated development.
Cross-browser compatibility (Chrome, Firefox, Edge).
Responsive design for desktop and mobile.
Non-Functional Requirements:

Performance: Smooth animations, < 60ms frame time.
Code Quality: Follow modern coding practices (modular code, linting, testing).
Documentation: Clear README.md and CURSORRULES.md for team collaboration.
3. User Stories
As a user, I want to customize the weather so I can see how the scene changes.
As a user, I want to choose different sceneries to explore various views.
As a user, I want random events to occur so the scene feels dynamic.
As a user, I want to toggle between realistic and voxel graphics for a different visual experience.
As a developer, I want to use Cursor to speed up development and ensure consistency.
4. Success Metrics
Demo-ready in 2-3 weeks.
Positive feedback from leadership on the use of modern practices and creativity.
Smooth performance with no noticeable lag.
Codebase is modular and well-documented for future expansion.
5. Risks
Overcomplicating the graphics (e.g., voxel rendering might be resource-intensive).
Cursor automation might introduce errors if not properly configured.
Limited time to implement all features; prioritize core functionality (weather, scenery, graphics toggle).
Technology Stack
Since you want simple JavaScript-based technologies, here’s the stack:

Frontend Framework: Vanilla JavaScript (for simplicity) with HTML5 Canvas for 2D rendering.
Graphics Library:
Three.js for voxel-style rendering and potential 3D effects.
p5.js for simpler 2D realistic rendering (alternative to Canvas if needed).
UI Library: Basic HTML/CSS for dropdowns and buttons (or a lightweight library like Tailwind CSS for styling).
Development Tools:
Cursor for semi-automated coding.
Vite as a build tool for fast development and hot reloading.
ESLint and Prettier for code quality.
Git for version control.
Assets:
Use free sprite sheets or generate simple assets for weather effects, random events, and scenery backgrounds.
Tent frame can be a static PNG overlay.
Why This Stack?

Vanilla JS keeps it lightweight and avoids framework overhead.
Three.js is great for voxel rendering and can handle realistic effects if needed.
Vite ensures a fast dev environment.
Cursor will help automate repetitive tasks (e.g., generating UI components, scaffolding files).
Development Plan
Phase 1: Setup and Core Structure (Days 1-3)
Project Setup:
Initialize a new project with Vite: npm create vite@latest tentview -- --template vanilla.
Install dependencies: Three.js, ESLint, Prettier.
Set up Git and create a repository.
Basic Scene:
Create a Canvas element for rendering.
Add a static tent frame (PNG overlay) to mimic the view from inside the tent.
Render a default scene (lake with a campfire, as in the image) using 2D Canvas.
Cursor Integration:
Configure Cursor to assist with scaffolding (e.g., generating HTML/CSS for UI).
Use Cursor to auto-generate boilerplate for weather and scenery settings.
Phase 2: Weather and Scenery Settings (Days 4-7)
Weather System:
Implement weather effects using Canvas or p5.js:
Clear: Bright sky, sun.
Weak rain: Particle system for raindrops.
Fog: Overlay a semi-transparent white layer.
Thunderstorm: Rain + occasional lightning flash (CSS animation).
Snow: Particle system for snowflakes.
Add a dropdown to toggle weather.
Scenery System:
Create simple background images or procedural drawings for each scenery (lake, mountains, etc.).
Add a dropdown to switch sceneries.
Use Cursor to generate repetitive code for each scenery (e.g., background rendering logic).
Phase 3: Random Events and Graphics Toggle (Days 8-12)
Random Events:
Implement a timer to trigger random events every 10-30 seconds.
Add animations for:
UFO: A sprite moving across the sky.
Birds: A flock of sprites with simple flapping animation.
Shooting star: A quick streak of light.
Wildlife: A sprite walking across the foreground.
Add a "Randomize" button for manual triggers.
Graphics Toggle:
For realistic style, stick with 2D Canvas rendering.
For voxel style, use Three.js to render blocky versions of the scenery (e.g., blocky trees, water).
Add a toggle button to switch between styles.
Use Cursor to help with Three.js setup and voxel rendering logic.
Phase 4: Polish and Testing (Days 13-15)
UI Polish:
Style the dropdowns/buttons with Tailwind CSS or custom CSS.
Ensure responsiveness for mobile devices.
Performance Optimization:
Optimize particle systems (e.g., limit number of raindrops/snowflakes).
Test on multiple browsers.
Testing:
Test all weather, scenery, and graphics combinations.
Ensure random events don’t overlap or cause lag.
Documentation:
Write README.md and CURSORRULES.md.
Phase 5: Demo Preparation (Day 16)
Record a short demo video showcasing all features.
Prepare a presentation for leadership, highlighting modern practices (e.g., use of Cursor, modular code, Three.js for voxel rendering).