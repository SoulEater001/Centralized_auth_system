exports.getOrders = (req, res) => {
  res.json([
    { id: 1, item: "Laptop", ownerId: req.user.userId }
  ]);
};

exports.createOrder = (req, res) => {
  res.json({
    message: "Order created",
    order: req.body
  });
};

exports.deleteOrder = (req, res) => {
  res.json({
    message: `Order ${req.params.id} deleted`
  });
};