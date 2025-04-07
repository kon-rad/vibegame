const express = require('express');
const router = express.Router();
const database = require('../models/database');

/**
 * GET /api/character/:characterId/thoughts
 * Retrieves the thoughts and actions history for a specific character.
 */
router.get('/:characterId/thoughts', async (req, res) => {
  const { characterId } = req.params;
  const limit = parseInt(req.query.limit) || 100; // Default limit to 100 entries
  const type = req.query.type || null; // Optional filter by type (thought, action, movement)

  try {
    const thoughts = await database.getCharacterThoughts(characterId, type, limit);
    
    // Parse JSON strings back into objects for position/metadata if they exist
    const parsedThoughts = thoughts.map(thought => {
      let parsedPosition = null;
      let parsedMetadata = null;
      try {
        if (thought.position) parsedPosition = JSON.parse(thought.position);
      } catch (e) { console.warn(`Failed to parse position for thought ${thought.id}`); }
      try {
        if (thought.metadata) parsedMetadata = JSON.parse(thought.metadata);
      } catch (e) { console.warn(`Failed to parse metadata for thought ${thought.id}`); }
      
      return {
        ...thought,
        position: parsedPosition,
        metadata: parsedMetadata
      };
    });

    res.json({
      success: true,
      characterId: Number(characterId),
      thoughts: parsedThoughts
    });
  } catch (error) {
    console.error(`Error fetching thoughts for character ${characterId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch character thoughts' 
    });
  }
});

module.exports = router; 