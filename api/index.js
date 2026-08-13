// api/index.js
const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { tmdb_id, type, season, episode } = req.query;

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
    // Build the URL
    let embedUrl;
    if (type === 'movie') {
      embedUrl = `https://vidsrc.to/embed/movie/${tmdb_id}`;
    } else {
      const s = season || 1;
      const e = episode || 1;
      embedUrl = `https://vidsrc.to/embed/tv/${tmdb_id}/${s}/${e}`;
    }
    
    console.log(`📺 Fetching: ${embedUrl}`);
    
    // Fetch the page
    const response = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Try to find the video URL
    // Look for patterns like: "https://.../master.m3u8"
    const patterns = [
      /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g,
      /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
      /https?:\/\/[^"'\s]+\.ts[^"'\s]*/g
    ];
    
    let videoUrl = null;
    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        videoUrl = matches[0];
        break;
      }
    }
    
    if (videoUrl) {
      console.log('✅ Found video URL');
      res.json({
        success: true,
        url: videoUrl,
        subtitles: [],
        title: 'Video found'
      });
    } else {
      // Try an alternative approach - look for iframe src
      const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (iframeMatch) {
        const iframeUrl = iframeMatch[1];
        console.log('🔍 Found iframe:', iframeUrl);
        
        // If it's a relative URL, make it absolute
        const finalUrl = iframeUrl.startsWith('http') ? iframeUrl : `https://vidsrc.to${iframeUrl}`;
        
        res.json({
          success: true,
          url: finalUrl,
          subtitles: [],
          title: 'Video found (iframe)'
        });
      } else {
        console.log('❌ No video found');
        res.status(404).json({
          success: false,
          error: 'No video stream found'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
};
