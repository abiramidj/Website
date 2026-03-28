module.exports = async (req, res) => {
  try {
    req.url = '/api' + req.url;
    console.log('[fn] url:', req.url, 'method:', req.method);
    const { default: app } = await import('../server/index.js');
    app(req, res);
  } catch (err) {
    console.error('[fn] error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
