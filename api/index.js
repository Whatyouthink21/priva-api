// api/index.js
// This is the main API endpoint - it works with Vercel's default routing

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

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
    const { scrapeVidsrc } = require('@definisi/vidsrc-scraper');
    
    console.log(`📺 Fetching: ${type} ${tmdb_id}`);
    
    // Get the video
    const result = await scrapeVidsrc(tmdb_id, type, season || null, episode || null);
    
    if (result && result.hlsUrl) {
      res.json({
        success: true,
        url: result.hlsUrl,
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
