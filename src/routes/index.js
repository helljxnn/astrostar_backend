import { Router } from "express"; // Usamos Router de expressgit add src/routes/index.js
import authRoutes from "../modules/Auth/routes/auth.routes.js";
import roleRoutes from "../modules/Roles/routes/roles.routes.js";
import employeeRoutes from "../modules/Services/Employees/routes/employees.routes.js";
import usersRoutes from "../modules/Users/routes/users.routes.js";
import providerRoutes from "../modules/Providers/routes/providers.routes.js";
import temporaryWorkersRoutes from "../modules/Athletes/TemporaryWorkers/routes/temporaryworkers.routes.js";
import documentTypesRoutes from "./documentTypes.routes.js";
import sportsCategoryRoutes from "../modules/Athletes/SportsCategory/routes/sportsCategory.routes.js";
import teamsRoutes from "../modules/Teams/routes/teams.routes.js";
import trainersRoutes from "../modules/Teams/routes/trainers.routes.js";
import athletesRoutes from "../modules/Teams/routes/athletes.routes.js";
import eventsRoutes from "../modules/Events/events.routes.js";
import registrationsRoutes from "../modules/Events/Registrations/registrations.routes.js";
import uploadRoutes from "../shared/routes/upload.routes.js";
import testEmailRoutes from "./testEmail.js";

const router = Router();

// Module routes
router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/employees", employeeRoutes);
router.use("/users", usersRoutes);
router.use("/providers", providerRoutes);
router.use("/temporary-workers", temporaryWorkersRoutes);
router.use("/document-types", documentTypesRoutes);
router.use("/sports-categories", sportsCategoryRoutes);
router.use("/teams", teamsRoutes);
router.use("/trainers", trainersRoutes);
router.use("/athletes", athletesRoutes);
router.use("/events", eventsRoutes);
router.use("/registrations", registrationsRoutes);

router.use("/upload", uploadRoutes);

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
      "SportsCategories",
      "Teams",
      "Trainers",
      "Athletes",
      "Events",
      "Registrations"
    ],
  });
});

export default router;
