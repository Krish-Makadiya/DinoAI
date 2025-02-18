import express from "express";
import connectDB from "./db/connectDB.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
connectDB();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/user", userRoutes);
app.use("/project", projectRoutes);
app.use("/ai", aiRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

export default app;
