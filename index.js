const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nyhda.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("database connected");
    const toolsCollection = client.db("electool").collection("tools");
    const orderCollection = client.db("electool").collection("order");
    const userCollection = client.db("electool").collection("user");

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



    app.put('/user/:email', async(req, res) => {
        const email = req.params.email;
        const filter = {email: email};
        const user = req.body;
        const options = { upsert: true };

        const updateDoc = {
            $set: user,
          };
          const result = await userCollection.updateOne(filter, updateDoc, options); 
          const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
          res.send(result)
    });

    
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
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
