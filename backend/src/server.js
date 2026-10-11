const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});