var express = require('express')
var cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
var app = express()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 3000;

//middlewire
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.exrbbd1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        //database collection

        const database = client.db("SparkCart");
        const usercollection = database.collection("users");
        const mobilecollection = database.collection("mobiles");
        const cartscollection = database.collection("Carts");

        // user related
        // axios.post('http://localhost:3000/users', userinfo)
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existuser = await usercollection.findOne(query)
            if (existuser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await usercollection.insertOne(user)
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await usercollection.find().toArray()
            res.send(result)
        })

        // all mobile collection
        app.get('/mobiles', async (req, res) => {
            console.log(req.query)

            //  only for mobiles to get the mobiles only
            if (Object.keys(req.query).length === 0) {
                const result = await mobilecollection.find({}).toArray()
                return res.send(result)
            }

            const filter = req?.query

            //console.log(filter)
            let query = {}
            if (filter?.search == "") // initial state when user don,t set any search value
                    {
                        query = {}
                    }
            else { // when user set any search value
                query = {
                    $or: [
                        { processor: { $regex: filter?.search, $options: 'i' } },
                        { mobileName: { $regex: filter?.search, $options: 'i' } },
                        { os: { $regex: filter?.search, $options: 'i' } },
                        { type: { $regex: filter?.search, $options: 'i' } },
                        { ram: { $regex: filter?.search, $options: 'i' } },
                        { camera: { $regex: filter?.search, $options: 'i' } },
                    ],
                }
            }

            const options = {
                sort: {
                    price: filter.sort === "asc" ? 1 : -1
                }
            }

            const result = await mobilecollection.find(query, options).toArray()
            return res.send(result)
        })

        // specific mobile
        app.get('/mobiles/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await mobilecollection.findOne(query)
            res.send(result)
        })


        app.get('/carts', async (req, res) => {
            // all carts
            let query = {}

            // carts of specific user
            const user_email = req.query.user

            if (user_email) {
                query.user = user_email
                console.log("user", query.user)
            }
            const result = await cartscollection.find(query).toArray()
            res.send(result)
        })

        // post into cart collection
        app.post('/carts', async (req, res) => {
            const user = req.body;
            const result = await cartscollection.insertOne(user)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('SparkCart running')
})

app.listen(port, () => {
    console.log(`SparkCart app listening on port ${port}`)
})