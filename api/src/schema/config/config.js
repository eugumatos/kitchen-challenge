const base = {
  username: process.env.DB_USER || 'kitchen_queue',
  password: process.env.DB_PASSWORD || 'kitchen_queue',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
};

module.exports = {
  development: { ...base, database: process.env.DB_NAME || 'kitchen_queue' },
  test: { ...base, database: process.env.DB_NAME || 'kitchen_queue_test' },
};
