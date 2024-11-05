const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const uri = `${process.env.MONGODB_URI}/${process.env.MONGODB_DB_NAME}`;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch(err => console.error("MongoDB connection error: ", err));

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const johariRoutes = require('./routes/johari');

// Use routes
app.use('/jw-api/johari', johariRoutes);

module.exports = app;