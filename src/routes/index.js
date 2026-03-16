import { Router } from "express";
import authRoutes from "../modules/Auth/routes/auth.routes.js";
import roleRoutes from "../modules/Roles/routes/roles.routes.js";
import employeeRoutes from "../modules/Services/Employees/routes/employees.routes.js";
import usersRoutes from "../modules/Users/routes/users.routes.js";
import providerRoutes from "../modules/Providers/routes/providers.routes.js";
import materialsRoutes from "../modules/Materials/routes/index.js";
import temporaryWorkersRoutes from "../modules/Athletes/TemporaryWorkers/routes/temporaryworkers.routes.js";
import donorsSponsorsRoutes from "../modules/Donations/DonorsSponsors/routes/donorsSponsors.routes.js";
import donationsRoutes from "../modules/Donations/Donations/routes/donations.routes.js";
import paymentsRoutes from "../modules/Payments/routes/payments.routes.js";
import paymentSettingsRoutes from "../modules/Payments/routes/paymentSettings.routes.js";

import documentTypesRoutes from "./documentTypes.routes.js";
import sportsCategoryRoutes from "../modules/Athletes/SportsCategory/routes/sportsCategory.routes.js";
import teamsRoutes from "../modules/Teams/routes/teams.routes.js";
import trainersRoutes from "../modules/Teams/routes/trainers.routes.js";
import athletesRoutes from "../modules/Teams/routes/athletes.routes.js";
import deportistasRoutes from "../modules/Athletes/routes/athletes.routes.js";
import guardiansRoutes from "../modules/Athletes/Guardians/routes/guardians.routes.js";
import assistanceathletesRoutes from "../modules/Athletes/Assistanceathletes/routes/Assistanceathletes.routes.js";
import preRegistrationsRoutes from "../modules/PreRegistrations/routes/preRegistrations.routes.js";
import enrollmentsRoutes from "../modules/Enrollments/routes/enrollments.routes.js";
import referenceRoutes from "./reference.routes.js";
import eventsRoutes from "../modules/Events/events.routes.js";
import registrationsRoutes from "../modules/Events/Registrations/registrations.routes.js";
import rsvpRoutes from "../modules/Events/RSVP/rsvp.routes.js";
import uploadRoutes from "../services/shared/routes/upload.routes.js";
import testEmailRoutes from "./testEmail.js";
import scheduleRoutes from "../modules/Services/EmployeesSchedule/routes/schedule.routes.js";
import groupsRoutes from "../modules/Services/Groups/routes/groups.routes.js";
import membershipsRoutes from "../modules/Services/Groups/routes/memberships.routes.js";
import appointmentRoutes from "../modules/Services/AppointmentManagement/routes/AppointmentManagement.routes.js";

const router = Router();

// Module routes
router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/employees", employeeRoutes);
router.use("/users", usersRoutes);
router.use("/providers", providerRoutes);
router.use("/", materialsRoutes); // Materials, Categories, Material-Movements
router.use("/temporary-workers", temporaryWorkersRoutes);
router.use("/donors-sponsors", donorsSponsorsRoutes);
router.use("/donations", donationsRoutes);
router.use("/payments", paymentsRoutes); // Nuevo módulo de Gestión de Pagos
router.use("/payment-settings", paymentSettingsRoutes); // Configuración de pagos
router.use("/document-types", documentTypesRoutes);
router.use("/sports-categories", sportsCategoryRoutes);
router.use("/teams", teamsRoutes);
router.use("/trainers", trainersRoutes);
router.use("/teams-athletes", athletesRoutes);
router.use("/athletes", deportistasRoutes);
router.use("/guardians", guardiansRoutes);
// Módulo asistencia deportistas
router.use("/assistance-athletes", assistanceathletesRoutes);
router.use("/pre-registrations", preRegistrationsRoutes);
router.use("/enrollments", enrollmentsRoutes);
router.use("/reference", referenceRoutes);
router.use("/events", eventsRoutes);
router.use("/registrations", registrationsRoutes);
router.use("/", rsvpRoutes); // RSVP routes at root level for clean URLs
router.use("/schedules", scheduleRoutes);
router.use("/groups", groupsRoutes);
router.use("/", membershipsRoutes);
router.use("/appointments", appointmentRoutes);

router.use("/upload", uploadRoutes);
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
      "DonorsSponsors",
      "Donations",
      "Payments", // Nuevo módulo
      "DocumentTypes",
      "SportsCategories",
      "Teams",
      "Trainers",
      "Athletes",
      "Guardians",
      "AssistanceAthletes",
      "PreRegistrations",
      "Enrollments",
      "Events",
      "Registrations",
      "EmployeeSchedules",
      "Groups",
      "GroupMemberships",
    ],
  });
});

export default router;

