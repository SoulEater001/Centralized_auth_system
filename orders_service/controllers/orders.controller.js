let orders = [];

exports.getOrders = (req, res) => {
  // Admin sees everything
  const isPrivileged =
  req.user.roles.includes("admin");
  if (isPrivileged) {
    return res.json(orders);
  }

  // Others see only their orders
  const userOrders = orders.filter(
    order => order.ownerId === req.user.userId
  );

  res.json(userOrders);
};

exports.createOrder = (req, res) => {
  const { item } = req.body;
  console.log(item)
  const newOrder = {
    id: Date.now().toString(),
    item,
    ownerId: req.user.userId
  };

  orders.push(newOrder);

  res.status(201).json(newOrder);
};

exports.deleteOrder = (req, res) => {
  const { id } = req.params;

  const orderIndex = orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found" });
  }

  const order = orders[orderIndex];

  // 🔥 ABAC check (very important)
  if (order.ownerId !== req.user.userId && !req.user.roles.includes("admin")) {
    return res.status(403).json({ message: "Not allowed to delete this order" });
  }

  orders.splice(orderIndex, 1);

  res.json({
    message: "Order deleted",
    deletedOrder: order
  });
};