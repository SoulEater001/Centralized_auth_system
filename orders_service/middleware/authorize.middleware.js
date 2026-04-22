exports.authorize = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};