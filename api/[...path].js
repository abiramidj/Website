module.exports = async (req, res) => {
  const { default: app } = await import('../server/index.js');
  app(req, res);
};
