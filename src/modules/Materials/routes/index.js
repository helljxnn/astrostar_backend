import express from "express";
import materialsRoutes from "./materials.routes.js";
import categoriesRoutes from "./categories.routes.js";
import movementsRoutes from "./movements.routes.js";
import transfersRoutes from "./transfers.routes.js";
import eventMaterialsRoutes from "./eventMaterials.routes.js";
import eventMaterialsConsumableRoutes from "./eventMaterialsConsumable.routes.js";
import eventMaterialsReusableRoutes from "./eventMaterialsReusable.routes.js";
import eventMaterialsSummaryRoutes from "./eventMaterialsSummary.routes.js";

const router = express.Router();

// Materials Module Routes
// Base: /api/materials
router.use("/materials/categories", categoriesRoutes); // GET /api/materials/categories
router.use("/materials/material-movements", movementsRoutes); // GET /api/materials/material-movements
router.use("/materials/movements", movementsRoutes); // GET /api/materials/movements (alias)

// Event materials routes - IMPORTANT: More specific routes MUST come BEFORE generic ones
router.use("/materials/events", eventMaterialsSummaryRoutes); // Event materials summary (optimized)
router.use("/materials/events", eventMaterialsConsumableRoutes); // Event consumable materials routes
router.use("/materials/events", eventMaterialsReusableRoutes); // Event reusable materials routes
router.use("/materials/events", eventMaterialsRoutes); // Event materials routes (legacy)

router.use("/materials", transfersRoutes); // Transfer routes (must be before materials)
router.use("/materials", materialsRoutes); // GET /api/materials

export default router;
