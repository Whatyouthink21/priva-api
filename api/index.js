// api/index.js
// Using vidsrc.ts - a more reliable scraper

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get parameters
  const { tmdb_id, type, season, episode } = req.query;

  // If no parameters, show API info
  if (!tmdb_id || !type) {
    return res.json({
      status: 'Priva Player API is running!',
      usage: '/api?tmdb_id=1081003&type=movie',
      endpoints: {
        movie: '/api?tmdb_id=1081003&type=movie',
        tv: '/api?tmdb_id=1399&type=tv&season=1&episode=1'
      }
    });
  }

  try {
    // Import the scraper
    const { vidsrc } = require('vidsrc.ts');
    
    console.log(`📺 Fetching: ${type} ${tmdb_id}`);
    
    // Get the video
    let result;
    
    if (type === 'movie') {
      result = await vidsrc.movie(tmdb_id);
    } else if (type === 'tv') {
      const s = parseInt(season) || 1;
      const e = parseInt(episode) || 1;
      result = await vidsrc.tv(tmdb_id, s, e);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use "movie" or "tv"'
      });
    }
    
    if (result && result.url) {
      res.json({
        success: true,
        url: result.url,
        subtitles: result.subtitles || [],
        title: result.title || ''
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No stream found'
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
};
