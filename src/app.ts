import "dotenv/config";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import authRouter from "./routes/auth.route";
import ikuRouter from "./routes/iku.route";
import componentRouter from "./routes/component.route";
import ikuFormulaRouter from "./routes/ikuFormula.route";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend API Running");
});

app.use("/api/auth", authRouter);
app.use("/api/ikus", ikuRouter);
app.use("/api/components", componentRouter);
app.use("/api/iku-formulas", ikuFormulaRouter);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
