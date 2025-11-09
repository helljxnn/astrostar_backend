import express from "express";
import authRoutes from "../modules/Auth/routes/auth.routes.js";
import roleRoutes from "../modules/Roles/routes/roles.routes.js";
import employeeRoutes from "../modules/Services/Employees/routes/employees.routes.js";
import usersRoutes from "../modules/Users/routes/users.routes.js";
import providerRoutes from "../modules/Providers/routes/providers.routes.js";
import temporaryWorkersRoutes from "../modules/Athletes/TemporaryWorkers/temporaryworkers.routes.js";
import documentTypesRoutes from "./documentTypes.routes.js";
import testEmailRoutes from "./testEmail.js";
import teamsRoutes from "../modules/Teams/routes/teams.routes.js";
import trainersRoutes from "../modules/Teams/routes/trainers.routes.js";
import athletesRoutes from "../modules/Teams/routes/athletes.routes.js";

const router = express.Router();

// Module routes
router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/employees", employeeRoutes);
router.use("/users", usersRoutes);
router.use("/providers", providerRoutes);
router.use("/temporary-workers", temporaryWorkersRoutes);
router.use("/document-types", documentTypesRoutes);
router.use("/teams", teamsRoutes);
router.use("/trainers", trainersRoutes);
router.use("/athletes", athletesRoutes);


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
      "TemporaryWorkers",
      "DocumentTypes",
      "Teams",
      "Trainers",
      "Athletes"
    ],
  });
});

export default router;
