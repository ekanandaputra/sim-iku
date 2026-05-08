import { Router } from "express";
import {
  listIkuUsers,
  assignIkuUsers,
  unassignIkuUsers,
  listIkusByUser,
  syncIkuUsers,
} from "../controllers/ikuUser.controller";
import { validateBody } from "../middleware/validate";
import { AssignIkuUsersDto } from "../dtos/ikuUser.dto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: IkuUsers
 *   description: Assign / unassign users to IKU
 */

/**
 * @swagger
 * /api/iku-users/by-user/{userId}:
 *   get:
 *     summary: List all IKUs assigned to a specific user
 *     tags: [IkuUsers]
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
router.get("/by-user/:userId", listIkusByUser);

/**
 * @swagger
 * /api/iku-users/{ikuId}:
 *   get:
 *     summary: List all users assigned to an IKU
 *     tags: [IkuUsers]
 *     parameters:
 *       - in: path
 *         name: ikuId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: IKU not found
 */
router.get("/:ikuId", listIkuUsers);

/**
 * @swagger
 * /api/iku-users/{ikuId}/assign:
 *   post:
 *     summary: Assign users to an IKU (adds without removing existing)
 *     tags: [IkuUsers]
 *     parameters:
 *       - in: path
 *         name: ikuId
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
 *         description: IKU not found
 */
router.post("/:ikuId/assign", validateBody(AssignIkuUsersDto), assignIkuUsers);

/**
 * @swagger
 * /api/iku-users/{ikuId}/unassign:
 *   delete:
 *     summary: Unassign users from an IKU
 *     tags: [IkuUsers]
 *     parameters:
 *       - in: path
 *         name: ikuId
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
 *         description: IKU not found
 */
router.delete("/:ikuId/unassign", validateBody(AssignIkuUsersDto), unassignIkuUsers);

/**
 * @swagger
 * /api/iku-users/{ikuId}:
 *   put:
 *     summary: Sync (replace) all user assignments for an IKU
 *     tags: [IkuUsers]
 *     parameters:
 *       - in: path
 *         name: ikuId
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
 *                 description: Full list of userIds (existing removed, new ones added)
 *                 example: ["user-uuid-1", "user-uuid-2"]
 *     responses:
 *       200:
 *         description: Assignments updated
 *       404:
 *         description: IKU not found
 */
router.put("/:ikuId", validateBody(AssignIkuUsersDto), syncIkuUsers);

export default router;
