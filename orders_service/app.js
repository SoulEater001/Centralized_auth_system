const express = require("express");
const jwt = require("jsonwebtoken");

const orderRoutes = require("./routes/orders.routes");

require("dotenv").config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT;


// app.get("/", authenticate, authorize("orders:read"), (req, res) => {
  //   res.json([{ id: 1, item: "Laptop" }]);
  // });
  
  // Routes
  app.get("/test", (req, res) => {
    res.send("Orders Service is running");
  });
app.use("/", orderRoutes);

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});