const express = require('express');
const router = express.Router();
const environmentConfig = require('../config/environmentConfig');

/**
 * GET /api/environment
 * Returns the full environment configuration
 */
router.get('/', (req, res) => {
  res.json(environmentConfig);
});

/**
 * GET /api/environment/scene
 * Returns just the scene configuration
 */
router.get('/scene', (req, res) => {
  res.json(environmentConfig.scene);
});

/**
 * GET /api/environment/trees
 * Returns just the trees configuration
 */
router.get('/trees', (req, res) => {
  res.json(environmentConfig.trees);
});

/**
 * GET /api/environment/characters
 * Returns all characters configuration
 */
router.get('/characters', (req, res) => {
  res.json(environmentConfig.characters);
});

/**
 * GET /api/environment/characters/:id
 * Returns a specific character configuration
 */
router.get('/characters/:id', (req, res) => {
  const characterId = parseInt(req.params.id);
  const character = environmentConfig.characters.find(c => c.id === characterId);
  
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }
  
  res.json(character);
});

module.exports = router; 