require("dotenv").config();

module.exports = {
  DB: process.env.APP_DB,
  PORT: process.env.APP_PORT,
  SECRET: process.env.APP_SECRET,
  KEY: process.env.SU_KEY,
  DEFAULT_SECRET: process.env.DEFAULT_ADMIN_SECRET,
};
