# TentView

An interactive web-based experience that simulates the view from inside a tent, featuring dynamic weather effects, various scenery options, and random events. Built with JavaScript, Canvas, and Three.js.

## Features

- **Dynamic Weather Effects:**
  - Clear skies
  - Light rain
  - Fog
  - Thunderstorm
  - Snow

- **Scenic Views:**
  - Lake (default)
  - Mountains
  - Distant city
  - Ocean
  - Forest
  - Desert
  - Plains
  - Volcano
  - Snowy tundra
  - Jungle

- **Random Events:**
  - UFO sightings
  - Bird flocks
  - Shooting stars
  - Wildlife appearances

- **Graphics Styles:**
  - Realistic (2D Canvas)
  - Voxel (Three.js)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tentview.git
   cd tentview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

- Use the weather dropdown to change weather conditions
- Select different scenery from the scenery dropdown
- Click "Toggle Voxel Style" to switch between realistic and voxel graphics
- Click "Trigger Random Event" to manually trigger random events (they also occur automatically)

## Development

The project is structured into several key components:

- `scene.js`: Manages the background scenery rendering
- `weather.js`: Handles weather effects and particles
- `events.js`: Controls random events and animations
- `graphics.js`: Manages the switch between realistic and voxel styles
- `ui.js`: Handles user interface elements

### Adding New Features

- **New Weather Effects:** Add new weather types in `weather.js` and update the UI options
- **New Scenery:** Add new scene rendering methods in `scene.js` and corresponding voxel versions in `graphics.js`
- **New Random Events:** Add new event types in `events.js`

## Built With

- [Vite](https://vitejs.dev/) - Build tool and development server
- [Three.js](https://threejs.org/) - 3D graphics library for voxel rendering
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the peaceful experience of camping in nature
- Thanks to the Three.js and Canvas communities for excellent documentation
- Special thanks to all contributors and users of this project