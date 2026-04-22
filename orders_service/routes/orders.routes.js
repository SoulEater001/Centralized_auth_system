const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");

const {
  getOrders,
  createOrder,
  deleteOrder
} = require("../controllers/orders.controller");

// Routes with RBAC
router.get(
  "/",
  authenticate,
  authorize("orders:read"),
  getOrders
);

router.post(
  "/",
  authenticate,
  authorize("orders:write"),
  createOrder
);

router.delete(
  "/:id",
  authenticate,
  authorize("orders:delete"),
  deleteOrder
);

module.exports = router;