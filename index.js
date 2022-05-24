const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nyhda.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("database connected");
    const toolsCollection = client
      .db("electool")
      .collection("tools");



    app.get("/tools", async (req, res) => {
        const query = {};
        const cursor = await toolsCollection.find(query);
        const tools = await cursor.toArray();
        res.send(tools);
      });

      app.get("/tools/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const tool = await toolsCollection.findOne(query);
        res.send(tool);
      });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The server is working");
});

app.listen(port, () => {
  console.log(`Assignment 12 listening at http://localhost:${port}`);
});
