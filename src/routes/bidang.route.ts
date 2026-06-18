import { Router } from "express";
import {
  listBidang,
  getBidang,
  createBidang,
  updateBidang,
  deleteBidang,
} from "../controllers/bidang.controller";
import {
  listBidangUsers,
  assignBidangUsers,
  unassignBidangUsers,
  syncBidangUsers,
  listBidangsByUser,
} from "../controllers/bidangUser.controller";
import {
  listBidangIkus,
  assignBidangIkus,
  unassignBidangIkus,
  syncBidangIkus,
} from "../controllers/bidangIku.controller";
import {
  listBidangComponents,
  assignBidangComponents,
  unassignBidangComponents,
  syncBidangComponents,
} from "../controllers/bidangComponent.controller";
import { validateBody } from "../middleware/validate";
import {
  CreateBidangDto,
  UpdateBidangDto,
  AssignBidangUsersDto,
  AssignBidangIkusDto,
  AssignBidangComponentsDto,
} from "../dtos/bidang.dto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bidang
 *   description: Manajemen Bidang (unit kerja) beserta relasi ke user, IKU, dan IKP/Component
 */

// ─────────────────────────────────────────────
// CRUD BIDANG
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/bidang:
 *   get:
 *     summary: Daftar semua Bidang
 *     tags: [Bidang]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", listBidang);

/**
 * @swagger
 * /api/bidang/by-user/{userId}:
 *   get:
 *     summary: Daftar semua Bidang yang diikuti oleh seorang user
 *     tags: [Bidang]
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
router.get("/by-user/:userId", listBidangsByUser);

/**
 * @swagger
 * /api/bidang/{id}:
 *   get:
 *     summary: Detail satu Bidang (beserta users, IKUs, dan Components)
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Bidang not found
 */
router.get("/:id", getBidang);

/**
 * @swagger
 * /api/bidang:
 *   post:
 *     summary: Buat Bidang baru
 *     tags: [Bidang]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: "BID-001"
 *               name:
 *                 type: string
 *                 example: "Bidang Akademik"
 *               description:
 *                 type: string
 *                 example: "Menangani urusan akademik"
 *     responses:
 *       201:
 *         description: Bidang created
 *       409:
 *         description: Code already exists
 */
router.post("/", validateBody(CreateBidangDto), createBidang);

/**
 * @swagger
 * /api/bidang/{id}:
 *   put:
 *     summary: Update Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Bidang not found
 */
router.put("/:id", validateBody(UpdateBidangDto), updateBidang);

/**
 * @swagger
 * /api/bidang/{id}:
 *   delete:
 *     summary: Hapus Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Bidang not found
 */
router.delete("/:id", deleteBidang);

// ─────────────────────────────────────────────
// BIDANG ↔ USERS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/bidang/{id}/users:
 *   get:
 *     summary: Daftar user yang terdaftar di Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id/users", listBidangUsers);

/**
 * @swagger
 * /api/bidang/{id}/users:
 *   put:
 *     summary: Sync (replace) semua user di Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/:id/users", validateBody(AssignBidangUsersDto), syncBidangUsers);

/**
 * @swagger
 * /api/bidang/{id}/users/assign:
 *   post:
 *     summary: Tambahkan user ke Bidang (additive)
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       201:
 *         description: Users assigned
 */
router.post("/:id/users/assign", validateBody(AssignBidangUsersDto), assignBidangUsers);

/**
 * @swagger
 * /api/bidang/{id}/users/unassign:
 *   delete:
 *     summary: Hapus user dari Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Users unassigned
 */
router.delete("/:id/users/unassign", validateBody(AssignBidangUsersDto), unassignBidangUsers);

// ─────────────────────────────────────────────
// BIDANG ↔ IKU
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/bidang/{id}/ikus:
 *   get:
 *     summary: Daftar IKU yang dikaitkan ke Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id/ikus", listBidangIkus);

/**
 * @swagger
 * /api/bidang/{id}/ikus:
 *   put:
 *     summary: Sync (replace) IKU yang dikaitkan ke Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - ikuIds
 *             properties:
 *               ikuIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/:id/ikus", validateBody(AssignBidangIkusDto), syncBidangIkus);

/**
 * @swagger
 * /api/bidang/{id}/ikus/assign:
 *   post:
 *     summary: Tambahkan IKU ke Bidang (additive)
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - ikuIds
 *             properties:
 *               ikuIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: IKUs linked
 */
router.post("/:id/ikus/assign", validateBody(AssignBidangIkusDto), assignBidangIkus);

/**
 * @swagger
 * /api/bidang/{id}/ikus/unassign:
 *   delete:
 *     summary: Hapus kaitan IKU dari Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - ikuIds
 *             properties:
 *               ikuIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: IKUs unlinked
 */
router.delete("/:id/ikus/unassign", validateBody(AssignBidangIkusDto), unassignBidangIkus);

// ─────────────────────────────────────────────
// BIDANG ↔ COMPONENT (IKP)
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/bidang/{id}/components:
 *   get:
 *     summary: Daftar IKP/Component yang dikaitkan ke Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id/components", listBidangComponents);

/**
 * @swagger
 * /api/bidang/{id}/components:
 *   put:
 *     summary: Sync (replace) IKP/Component yang dikaitkan ke Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - componentIds
 *             properties:
 *               componentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/:id/components", validateBody(AssignBidangComponentsDto), syncBidangComponents);

/**
 * @swagger
 * /api/bidang/{id}/components/assign:
 *   post:
 *     summary: Tambahkan IKP/Component ke Bidang (additive)
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - componentIds
 *             properties:
 *               componentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Components linked
 */
router.post("/:id/components/assign", validateBody(AssignBidangComponentsDto), assignBidangComponents);

/**
 * @swagger
 * /api/bidang/{id}/components/unassign:
 *   delete:
 *     summary: Hapus kaitan IKP/Component dari Bidang
 *     tags: [Bidang]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - componentIds
 *             properties:
 *               componentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Components unlinked
 */
router.delete("/:id/components/unassign", validateBody(AssignBidangComponentsDto), unassignBidangComponents);

export default router;
