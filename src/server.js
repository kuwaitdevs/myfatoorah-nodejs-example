require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const expressLayouts = require("express-ejs-layouts");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);

app.use("/", require("./router/page"));
app.use("/api/v1", require("./router/api"));

app.all("/*", (_req, res, _next) => {
    res.status(404).json({ message: "not found" });
});

app.listen(process.env.PORT || "80", () => {
    console.log("Server started on: " + process.env.PORT);
});