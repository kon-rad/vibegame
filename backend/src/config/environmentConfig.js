/**
 * Environment configuration for the 3D scene
 * This provides the server-side configuration for the grassland environment
 * and character positions.
 */

const ENVIRONMENT_CONFIG = {
  // Scene settings
  scene: {
    groundSize: 100,
    groundColor: '#5D9C59',
    skyDistance: 450000,
    skyInclination: 0.6,
    skyAzimuth: 0.25,
    fogColor: '#030420',
    fogNear: 5,
    fogFar: 30,
    ambientLightIntensity: 0.2,
    directionalLightPosition: [2.5, 8, 5],
    directionalLightIntensity: 1.5,
  },
  
  // Tree configurations
  trees: {
    count: 15,
    radius: 30,
    minScale: 0.8,
    maxScale: 1.2,
    trunkColor: '#8B4513',
    leavesColor: '#2E8B57',
  },
  
  // Historical characters configuration
  characters: [
    {
      id: 1,
      name: 'Socrates',
      era: 'Ancient Greece, 470-399 BCE',
      bio: 'Athenian philosopher who is credited as the founder of Western philosophy.',
      avatar: '/assets/avatars/socrates.jpg',
      position: [-5, 0, 0],
      color: '#4287f5',
      primaryColor: '#8ca9ff',
      skinColor: '#e9c9a8',
      specialty: 'Dialectic method, ethics, epistemology',
      dialogueStyle: 'Questioning, ironic, probing',
      specialKeywords: ['knowledge', 'virtue', 'wisdom', 'justice', 'soul'],
      accessory: 'scroll'
    },
    {
      id: 2,
      name: 'Leonardo da Vinci',
      era: 'Renaissance Italy, 1452-1519',
      bio: 'Italian polymath whose interests included invention, drawing, painting, sculpture, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, paleontology, and cartography.',
      avatar: '/assets/avatars/davinci.jpg',
      position: [0, 0, 0],
      color: '#f54263',
      primaryColor: '#c74e36',
      skinColor: '#f0d0b0',
      specialty: 'Art, science, engineering, anatomy',
      dialogueStyle: 'Observant, analytical, curious',
      specialKeywords: ['art', 'invention', 'nature', 'anatomy', 'painting'],
      accessory: 'notebook'
    },
    {
      id: 3,
      name: 'Marie Curie',
      era: 'Modern Poland/France, 1867-1934',
      bio: 'Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.',
      avatar: '/assets/avatars/curie.jpg',
      position: [5, 0, 0],
      color: '#42f59e',
      primaryColor: '#457b86',
      skinColor: '#e0b6a0',
      specialty: 'Physics, chemistry, radioactivity',
      dialogueStyle: 'Precise, determined, methodical',
      specialKeywords: ['science', 'radioactivity', 'radium', 'polonium', 'research'],
      accessory: 'flask'
    }
  ]
};

module.exports = ENVIRONMENT_CONFIG; 