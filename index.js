const express = require("express");
const ejsRoutes = require("./routes/ejsRoutes.js");
const apiRoutes = require("./routes/apiRoutes.js");
const app = express();
app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (req, res) => {
  res.render("home");
});
app.use("/api/expenses", apiRoutes);
app.use("/expenses", ejsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
