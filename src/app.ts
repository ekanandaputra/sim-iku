import "dotenv/config";

import express from "express";
import swaggerUi from "swagger-ui-express";

import authRouter from "./routes/auth.route";
import ikuRouter from "./routes/iku.route";
import componentRouter from "./routes/component.route";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend API Running");
});

app.use("/api/auth", authRouter);
app.use("/api/ikus", ikuRouter);
app.use("/api/components", componentRouter);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
