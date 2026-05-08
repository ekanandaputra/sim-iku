import { Router } from "express";
import {
  listComponentUsers,
  assignUsers,
  unassignUsers,
  listComponentsByUser,
  syncUsers,
} from "../controllers/componentUser.controller";
import { validateBody } from "../middleware/validate";
import { AssignUsersDto, UnassignUsersDto } from "../dtos/componentUser.dto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ComponentUsers
 *   description: Assign / unassign users to components
 */

/**
 * @swagger
 * /api/component-users/{componentId}:
 *   get:
 *     summary: List all users assigned to a component
 *     tags: [ComponentUsers]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Component not found
 */
router.get("/:componentId", listComponentUsers);

/**
 * @swagger
 * /api/component-users/by-user/{userId}:
 *   get:
 *     summary: List all components assigned to a specific user
 *     tags: [ComponentUsers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/by-user/:userId", listComponentsByUser);

/**
 * @swagger
 * /api/component-users/{componentId}/assign:
 *   post:
 *     summary: Assign users to a component (adds without removing existing)
 *     tags: [ComponentUsers]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user-uuid-1", "user-uuid-2"]
 *     responses:
 *       201:
 *         description: Users assigned
 *       404:
 *         description: Component not found
 */
router.post("/:componentId/assign", validateBody(AssignUsersDto), assignUsers);

/**
 * @swagger
 * /api/component-users/{componentId}/unassign:
 *   delete:
 *     summary: Unassign users from a component
 *     tags: [ComponentUsers]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user-uuid-1"]
 *     responses:
 *       200:
 *         description: Users unassigned
 *       404:
 *         description: Component not found
 */
router.delete("/:componentId/unassign", validateBody(UnassignUsersDto), unassignUsers);

/**
 * @swagger
 * /api/component-users/{componentId}:
 *   put:
 *     summary: Sync (replace) all user assignments for a component
 *     tags: [ComponentUsers]
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Full list of userIds to assign (existing removed, new ones added)
 *                 example: ["user-uuid-1", "user-uuid-2"]
 *     responses:
 *       200:
 *         description: Assignments updated
 *       404:
 *         description: Component not found
 */
router.put("/:componentId", validateBody(AssignUsersDto), syncUsers);

export default router;
