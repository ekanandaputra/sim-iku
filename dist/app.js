"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const iku_route_1 = __importDefault(require("./routes/iku.route"));
const component_route_1 = __importDefault(require("./routes/component.route"));
const swagger_1 = require("./docs/swagger");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Backend API Running");
});
app.use("/api/auth", auth_route_1.default);
app.use("/api/ikus", iku_route_1.default);
app.use("/api/components", component_route_1.default);
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Not found" });
});
app.use(errorHandler_1.errorHandler);
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
