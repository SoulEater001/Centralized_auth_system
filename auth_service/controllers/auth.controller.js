const authService = require("../services/auth.service");
const redis = require("../utils/redis");
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

require("dotenv").config();

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

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
};