import express from "express";
import { TeamsController } from "../controllers/teams.controller.js";
import {
  teamsValidators,
  handleValidationErrors,
} from "../validators/teams.validator.js";

const router = express.Router();
const teamsController = new TeamsController();

/**
 * @swagger
 * /api/teams/check-name:
 *   get:
 *     summary: Check if team name is available
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Name availability
 */
router.get(
  "/check-name",
  teamsValidators.checkName,
  handleValidationErrors,
  teamsController.checkNameAvailability
);

/**
 * @swagger
 * /api/teams/stats:
 *   get:
 *     summary: Get team statistics
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Team statistics
 */
router.get("/stats", teamsController.getTeamStats);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get list of teams
 *     tags: [Teams]
 */
router.get(
  "/",
  teamsValidators.getAll,
  handleValidationErrors,
  teamsController.getAllTeams
);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 */
router.get(
  "/:id",
  teamsValidators.getById,
  handleValidationErrors,
  teamsController.getTeamById
);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create new team
 *     tags: [Teams]
 */
router.post(
  "/",
  teamsValidators.create,
  handleValidationErrors,
  teamsController.createTeam
);

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Update team
 *     tags: [Teams]
 */
router.put(
  "/:id",
  teamsValidators.update,
  handleValidationErrors,
  teamsController.updateTeam
);

/**
 * @swagger
 * /api/teams/{id}/status:
 *   patch:
 *     summary: Change team status
 *     tags: [Teams]
 */
router.patch(
  "/:id/status",
  teamsValidators.changeStatus,
  handleValidationErrors,
  teamsController.changeTeamStatus
);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete team
 *     tags: [Teams]
 */
router.delete(
  "/:id",
  teamsValidators.delete,
  handleValidationErrors,
  teamsController.deleteTeam
);

export default router;