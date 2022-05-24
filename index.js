const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("The server is working");
});

app.listen(port, () => {
  console.log(`Assignment 12 listening at http://localhost:${port}`);
});
