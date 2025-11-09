import express from "express";
import authRoutes from "../modules/Auth/routes/auth.routes.js";
import roleRoutes from "../modules/Roles/routes/roles.routes.js";
import employeeRoutes from "../modules/Services/Employees/routes/employees.routes.js";
import usersRoutes from "../modules/Users/routes/users.routes.js";
import providerRoutes from "../modules/Providers/routes/providers.routes.js";
import documentTypesRoutes from "./documentTypes.routes.js";
import testEmailRoutes from "./testEmail.js";
import sportsEquipmentRoutes from "../modules/SportsEquipment/routes/sportsEquipment.routes.js";
import donorsSponsorsRoutes from "../modules/DonorsSponsors/routes/donorsSponsor.routes.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// Module routes

// Public routes
router.use("/auth", authRoutes);

// Private routes
router.use("/roles", authenticateToken, roleRoutes);
router.use("/employees", authenticateToken, employeeRoutes);
router.use("/users", authenticateToken, usersRoutes);
router.use("/providers", authenticateToken, providerRoutes);
router.use("/document-types", authenticateToken, documentTypesRoutes);
router.use("/sportsEquipment", authenticateToken, sportsEquipmentRoutes);
router.use("/donorsSponsors", authenticateToken, donorsSponsorsRoutes);

// Test routes (only in development)
if (process.env.NODE_ENV === "development") {
  router.use("/test", testEmailRoutes);
}

// Health check for API
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running!",
    timestamp: new Date().toISOString(),
    modules: [
      "Auth",
      "Roles",
      "Employees",
      "Users",
      "Providers",
      "DocumentTypes",
    ],
  });
});

export default router;
