const express = require("express");
const app = express();
const cors = require("cors");
const port = 8080;

const userRouter = require("./routes/userRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const homeRouter = require("./routes/homeRoutes");
const listRouter = require("./routes/listRoutes");

app.use(express.json());
app.use(cors());

app.use("/user", userRouter);
app.use("/category", categoryRouter);
app.use("/home", homeRouter);
app.use("/list", listRouter);

app.listen(port, () => {
  console.log(`CollectorX listening on port ${port}`);
});
