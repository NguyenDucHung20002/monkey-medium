import { Op } from "sequelize";
import asyncMiddleware from "../middlewares/asyncMiddleware.js";
import User from "../models/mysql/User.js";
import ErrorResponse from "../responses/ErrorResponse.js";
import Role from "../models/mysql/Role.js";

// ==================== ban a user ==================== //
const banAUser = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const user = req.user;
  const { banType } = req.body;

  if (user.status === "banned") {
    throw ErrorResponse(404, `${user.profileInfo.fullname} already banned`);
  }

  let bannedUntil = null;

  if (banType === "1week") {
    bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + 7);
  }

  if (banType === "1month") {
    bannedUntil = new Date();
    bannedUntil.setMonth(bannedUntil.getMonth() + 1);
  }

  if (banType === "1year") {
    bannedUntil = new Date();
    bannedUntil.setFullYear(bannedUntil.getFullYear() + 1);
  }

  await user.update({
    status: "banned",
    banType,
    bannedUntil,
    bannedById: me.id,
    bansCount: user.bansCount + 1,
  });

  res.status(201).json({
    success: true,
    message: `${user.username} has been banned`,
  });
});

// ==================== update user ban ==================== //
const updateUserBan = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const user = req.user;
  const { banType } = req.body;

  if (user.status === "normal") {
    throw ErrorResponse(404, `${user.profileInfo.fullname} not banned`);
  }

  let bannedUntil = null;

  if (banType === "1week") {
    bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + 7);
  }

  if (banType === "1month") {
    bannedUntil = new Date();
    bannedUntil.setMonth(bannedUntil.getMonth() + 1);
  }

  if (banType === "1year") {
    bannedUntil = new Date();
    bannedUntil.setFullYear(bannedUntil.getFullYear() + 1);
  }

  await user.update({
    status: "banned",
    banType,
    bannedUntil,
    bannedById: me.id,
  });

  res.json({
    success: true,
    message: `Update ${user.username} ban successfully`,
  });
});

// ==================== unban a user ==================== //
const unBanAUser = asyncMiddleware(async (req, res, next) => {
  const user = req.user;

  await user.update({
    status: "normal",
    banType: null,
    bannedUntil: null,
    bannedById: null,
    bansCount: user.bansCount - 1,
  });

  res.json({
    success: true,
    message: `${user.username} has been unbanned`,
  });
});

// ==================== get all users ==================== //
const getAllUsers = asyncMiddleware(async (req, res, next) => {
  const { skip = 0, limit = 15, search } = req.query;

  let whereQuery = { id: { [Op.gt]: skip }, roleId: 1 };

  if (search) {
    whereQuery[Op.or] = [
      { username: { [Op.substring]: search } },
      { email: { [Op.substring]: search } },
    ];
  }

  const users = await User.findAll({
    where: whereQuery,
    attributes: { exclude: ["roleId", "bannedById", "reportsCount"] },
    include: {
      model: User,
      as: "bannedBy",
      attributes: ["email", "username"],
      include: { model: Role, as: "role", attributes: ["name", "slug"] },
    },
    limit: Number(limit) ? Number(limit) : 15,
    order: [["reportsCount", "DESC"]],
  });

  const newSkip = users.length > 0 ? users[users.length - 1].id : null;

  res.json({ success: true, data: users, newSkip });
});

export default { banAUser, unBanAUser, updateUserBan, getAllUsers };