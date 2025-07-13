require('dotenv').config();

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE,
  options: {
    trustServerCertificate: true,
    port: parseInt(process.env.DB_PORT) || 1433,
    connectionTimeout: parseInt(process.env.DB_TIMEOUT) || 60000
  }
};
