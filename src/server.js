import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { randomUUID } from "crypto";
import routerV1 from "./routes/v1.js";

const app = express();

// request id for every call (great for debugging)
app.use((req, res, next) => {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
});

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1", routerV1);

// 404 fallback
app.use((req, res) => res.status(404).json({ request_id: req.requestId, error: "Not found" }));

const port = process.env.PORT || 4000; // keep 4000 since it works for you
app.listen(port, () => console.log(`API on http://localhost:${port}`));
