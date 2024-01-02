// Load environment variables from .env file
require('dotenv').config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api", require("./user-management/user-routes"));
app.use("/api", require("./business-directory/business-routes"));
app.use("/api", require("./post-system/post-routes"));
app.use("/api", require("./live-chat/chat-routes"));

app.listen(
   process.env.PORT,
   () => {
      console.log("Service endpoint = %s", process.env.HOST_URL);
   }
);