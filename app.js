require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session"); 
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");

const app = express(); 


app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true, 
  })
);
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));


app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 }, 
  })
);


app.use("/protected", protectedRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Authentication API is running...");
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});


const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));
