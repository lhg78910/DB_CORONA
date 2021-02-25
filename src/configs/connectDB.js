import mysql from "mysql";
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  dateStrings: "date",
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Database connected!");
});

module.exports = connection;
