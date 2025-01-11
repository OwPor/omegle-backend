const express = require("express")
const cors = require("cors")
const { createServer } = require("http")
const socketSetup = require("./socket");
require("dotenv").config()

const app = express()

const server = createServer(app)

app.use(express.json())
app.use(cors({
    origin: ["https://owmegle.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

app.get("/", (req, res) => {
    res.redirect(301, "https://owmegle.vercel.app/")
})

const port = process.env.PORT || 5000

server.listen(port, () => {                                                                                         
    // console.log(`Server run on port http://localhost:${port}`)
    console.log(`Server running`)
})

socketSetup(server)