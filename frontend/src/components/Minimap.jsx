import React from 'react';
import PropTypes from 'prop-types';

const Minimap = ({ playerPosition, characters, mapSize = 200, worldSize = 50 }) => {
  // Calculate scale factor to map world coordinates to map pixels
  const scale = mapSize / worldSize;

  // Function to convert world coords to map coords
  const worldToMapCoords = (pos) => {
    // Assuming world center is [0, 0, 0] and map center is [mapSize/2, mapSize/2]
    // And using X/Z plane for the top-down view
    const mapX = (pos[0] * scale) + mapSize / 2;
    const mapZ = (pos[2] * scale) + mapSize / 2;
    
    // Clamp coordinates to map boundaries
    return {
      x: Math.max(0, Math.min(mapSize - 5, mapX)), // Subtract marker size
      y: Math.max(0, Math.min(mapSize - 5, mapZ)), 
    };
  };

  const playerMapPos = worldToMapCoords(playerPosition);

  return (
    <div className="minimap-container" style={{ width: mapSize, height: mapSize }}>
      {/* Player Marker */}
      <div 
        className="map-marker player-marker" 
        style={{ left: `${playerMapPos.x}px`, top: `${playerMapPos.y}px` }}
        title="You"
      />

      {/* Character Markers */}
      {characters.map((char) => {
        if (!char.position) return null; // Skip if character has no position
        const charMapPos = worldToMapCoords(char.position);
        return (
          <div 
            key={char.id} 
            className="map-marker character-marker" 
            style={{ 
              left: `${charMapPos.x}px`, 
              top: `${charMapPos.y}px`,
              backgroundColor: char.primaryColor || '#ff00ff' // Use character color or default
            }}
            title={char.name}
          />
        );
      })}

      <style jsx>{`
        .minimap-container {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background-color: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        }
        .map-marker {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 3px black;
          transform: translate(-50%, -50%); /* Center the marker */
        }
        .player-marker {
          background-color: #00ff00; /* Bright green for player */
          border: 1px solid white;
          z-index: 10;
        }
        .character-marker {
          background-color: #ff00ff; /* Default magenta for characters */
          border: 1px solid rgba(0, 0, 0, 0.5);
          z-index: 5;
        }
      `}</style>
    </div>
  );
};

Minimap.propTypes = {
  playerPosition: PropTypes.arrayOf(PropTypes.number).isRequired,
  characters: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    position: PropTypes.arrayOf(PropTypes.number),
    primaryColor: PropTypes.string,
  })).isRequired,
  mapSize: PropTypes.number,
  worldSize: PropTypes.number,
};

export default Minimap; 