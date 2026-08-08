const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

// THIS IS THE KEY
app.use(express.json());

app.get("/test", (req, res) => {
  res.send("Backend working");
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/interview", require("./routes/interview.routes"));

module.exports = app;

