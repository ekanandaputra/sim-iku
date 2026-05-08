import "reflect-metadata";
import "dotenv/config";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import authRouter from "./routes/auth.route";
import ikuRouter from "./routes/iku.route";
import componentRouter from "./routes/component.route";
import ikuFormulaRouter from "./routes/ikuFormula.route";
import componentRealizationRouter from "./routes/componentRealization.route";
import ikuResultRouter from "./routes/ikuResult.route";
import ikuTargetRouter from "./routes/ikuTarget.route";
import componentTargetRouter from "./routes/componentTarget.route";
import dashboardRouter from "./routes/dashboard.route";
import documentRouter from "./routes/document.route";
import tagRouter from "./routes/tag.route";
import realizationRouter from "./routes/realization.route";
import importRouter from "./routes/import.route";
import componentUserRouter from "./routes/componentUser.route";
import ikuUserRouter from "./routes/ikuUser.route";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Backend API Running");
});

app.use("/api/auth", authRouter);
app.use("/api/ikus", ikuRouter);
app.use("/api/components", componentRouter);
app.use("/api/component-realizations", componentRealizationRouter);
app.use("/api/iku-results", ikuResultRouter);
app.use("/api/iku-formulas", ikuFormulaRouter);
app.use("/api/iku-targets", ikuTargetRouter);
app.use("/api/component-targets", componentTargetRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/documents", documentRouter);
app.use("/api/tags", tagRouter);
app.use("/api/realizations", realizationRouter);
app.use("/api/import", importRouter);
app.use("/api/component-users", componentUserRouter);
app.use("/api/iku-users", ikuUserRouter);

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
