require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")

const app = express()
const PORT = process.env.PORT || 3001

// connect to mongodb database
mongoose.connect(process.env.MONGODB_URI_LOCAL)
.then(()=>console.log("Conntected to database"))
.catch((error)=>console.log(error))

app.listen(PORT, ()=>console.log("Server running on port", PORT))