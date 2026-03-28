module.exports = async (req, res) => {
  try {
    const { default: app } = await import('../server/index.js');
    app(req, res);
  } catch (err) {
    console.error('[vercel-fn] import error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
