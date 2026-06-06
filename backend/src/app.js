require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const userroutes = require("./routes/users.routes");
const authroutes = require("./routes/auth.routes");

app.use("/users", userroutes);
app.use("/auth", authroutes);

    
module.exports = app;