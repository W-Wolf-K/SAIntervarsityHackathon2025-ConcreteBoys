require('dotenv').config({path: __dirname + '/../../.env'});
const {MongoClient, ServerApiVersion} = require('mongodb')
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${username}:${password}@intervarsityhackathon20.yqnn4mm.mongodb.net/?retryWrites=true&w=majority&appName=IntervarsityHackathon2025ConcreteBoysCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi:{
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors:true,
    }
});

async function run() {
    try {
        // Connect client to the server 
        await client.connect();
        // Send ping to confirm a successful connection
        await client.db("admin").command({ping:1});
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }finally{
        await client.close();
    }
}

run().catch(console.dir);