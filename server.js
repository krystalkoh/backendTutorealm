require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db/db");
const parents = require("./routers/parentRoute");
const tutors = require("./routers/tutorRoute");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
connectDB(process.env.MONGODB_URI);

app.use("/api/parent", parents);
app.use("/api/tutor", tutors);

const PORT = process.env.PORT || 5001;
app.listen(PORT);
