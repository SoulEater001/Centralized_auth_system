const authService = require("../services/auth.service");
const redis = require("../utils/redis");
const jwt = require("jsonwebtoken");

exports.login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const result = await authService.logoutUser(token);

    res.json(result);
  } catch (error) {
    next(error);
  }
};