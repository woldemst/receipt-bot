 
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const PORT = process.env.BACK_PORT || 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("*", async (req, res) => {
  console.log(req.body);
});
app.get("*", async (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log(`Server is running on port ${PORT}`);
});
