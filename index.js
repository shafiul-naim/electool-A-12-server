const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



// const corsConfig = {
//   origin: https://assignment-12-client-d5b00.web.app,
//   Credential: true,
// }
// app.use((req, res, next) => {
//   res.header({"Access-Control-Allow-Origin": "*"});
//   next();
// })

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nyhda.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    console.log("database connected");
    const toolsCollection = client.db("electool").collection("tools");
    const orderCollection = client.db("electool").collection("order");
    const userCollection = client.db("electool").collection("user");
    const paymentCollection = client.db("electool").collection("payments");
    const reviewCollection = client.db("electool").collection("reviews");
    const profileCollection = client.db("electool").collection("profile");

    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const order = req.body;
      console.log(order);
      const price = order.totalPrice;
      const amount = price * 100;
      console.log(amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = await toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });

    app.post("/tools", verifyJWT, async (req, res) => {
      const tool = req.body;
      console.log("tool", tool);
      const result = await toolsCollection.insertOne(tool);
      res.send(result);
    });

    app.delete("/tools/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    });

    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      console.log(users)
      res.send(users);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });





    app.put("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const updatedProfile = req.body.updatedProfile;
      console.log(updatedProfile);
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: updatedProfile,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });






    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const options = { upsert: true };

      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });







    app.get("/allOrders", verifyJWT, async (req, res) => {
      const query = {};
      const cursor = await orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });







    app.get("/orders", verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);

      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        
        const orders = await cursor.toArray();
        console.log(orders)
        res.send(orders);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const orders = await orderCollection.findOne(query);
      res.send(orders);
    });

    app.delete("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
      res.send(updatedOrder);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });



    app.get("/reviews", async (req, res) => {
      const review = await reviewCollection.find().toArray();
      console.log(review)
      res.send(review);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });


    // app.get("/profile/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email: email };
    //   console.log("iuwahefruio", email);
    //   const profile = await profileCollection.findOne(query);
    //   res.send(profile);
    // });



 /*    app.get("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      console.log("iuwahefruio", email);
      const profile = await profileCollection.findOne(query);
      res.send(profile);
    });

    app.post("/profile", verifyJWT, async (req, res) => {
      const profile = req.body;
      const result = await profileCollection.insertOne(profile);
      res.send(result);
    }); */
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
