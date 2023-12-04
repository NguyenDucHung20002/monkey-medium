import { Op } from "sequelize";
import asyncMiddleware from "../middlewares/asyncMiddleware.js";
import Follow_Profile from "../models/mysql/Follow_Profile.js";
import Profile from "../models/mysql/Profile.js";
import User from "../models/mysql/User.js";
import ErrorResponse from "../responses/ErrorResponse.js";
import addUrlToImg from "../utils/addUrlToImg.js";
import Block from "../models/mysql/Block.js";
import Role from "../models/mysql/Role.js";

// ==================== follow a profile ==================== //
const followAProfile = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const user = req.user;

  if (user.profileInfo.id === me.profileInfo.id) {
    throw ErrorResponse(400, "Bad Request: Cannot follow yourself");
  }

  const followProfile = await Follow_Profile.findOne({
    where: { followedId: user.profileInfo.id, followerId: me.profileInfo.id },
  });

  if (!followProfile) {
    await Promise.all([
      Follow_Profile.create({
        followedId: user.profileInfo.id,
        followerId: me.profileInfo.id,
      }),
      me.profileInfo.increment({ followingCount: 1 }),
      user.profileInfo.increment({ followersCount: 1 }),
    ]);
  }

  res.status(201).json({
    success: true,
    message: `Successfully followed ${user.profileInfo.fullname}.`,
  });
});

// ==================== unfollow a profile ==================== //
const unFollowAProfile = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const user = req.user;

  if (user.profileInfo.id === me.profileInfo.id) {
    throw ErrorResponse(400, "Bad Request: Cannot unfollow yourself");
  }

  const followProfile = await Follow_Profile.findOne({
    where: { followedId: user.profileInfo.id, followerId: me.profileInfo.id },
  });

  if (followProfile) {
    await Promise.all([
      followProfile.destroy(),
      me.profileInfo.increment({ followingCount: -1 }),
      user.profileInfo.increment({ followersCount: -1 }),
    ]);
  }

  res.json({
    success: true,
    message: `Successfully unfollowed ${user.profileInfo.fullname}.`,
  });
});

// ==================== get list of followed profiles ==================== //
const getFolloweds = asyncMiddleware(async (req, res, next) => {
  const me = req.me ? req.me : null;
  const user = req.user;
  const { skip = 0, limit = 15 } = req.query;

  let followProfiles;

  let followeds;

  if (!me) {
    followProfiles = await Follow_Profile.findAll({
      where: { followerId: user.profileInfo.id, id: { [Op.gt]: skip } },
      attributes: ["id"],
      include: {
        model: Profile,
        as: "followed",
        attributes: ["id", "fullname", "avatar", "bio"],
        include: {
          model: User,
          as: "userInfo",
          attributes: ["username"],
          include: { model: Role, as: "role", attributes: ["slug"] },
        },
      },
      limit: Number(limit) ? Number(limit) : null,
    });
    followeds = followProfiles.map((followProfile) => {
      return {
        id: followProfile.followed.id,
        fullname: followProfile.followed.fullname,
        avatar: addUrlToImg(followProfile.followed.avatar),
        bio: followProfile.followed.bio,
        username: followProfile.followed.userInfo.username,
        role: followProfile.followed.userInfo.role.slug,
      };
    });
  }

  if (me && me.profileInfo.id === user.profileInfo.id) {
    followProfiles = await Follow_Profile.findAll({
      where: { followerId: user.profileInfo.id, id: { [Op.gt]: skip } },
      attributes: ["id"],
      include: {
        model: Profile,
        as: "followed",
        attributes: ["id", "fullname", "avatar", "bio"],
        include: {
          model: User,
          as: "userInfo",
          attributes: ["username"],
          include: { model: Role, as: "role", attributes: ["slug"] },
        },
      },

      limit: Number(limit) ? Number(limit) : null,
    });
    followeds = followProfiles.map((followProfile) => {
      return {
        id: followProfile.followed.id,
        fullname: followProfile.followed.fullname,
        avatar: addUrlToImg(followProfile.followed.avatar),
        bio: followProfile.followed.bio,
        username: followProfile.followed.userInfo.username,
        role: followProfile.followed.userInfo.role.slug,
        isFollowed: true,
      };
    });
  }

  if (me && me.profileInfo.id !== user.profileInfo.id) {
    followProfiles = await Follow_Profile.findAll({
      where: {
        followerId: user.profileInfo.id,
        id: { [Op.gt]: skip },
        "$followedBlocker.blockerId$": null,
        "$followedBlocked.blockedId$": null,
      },
      attributes: ["id"],
      include: [
        {
          model: Profile,
          as: "followed",
          attributes: ["id", "fullname", "avatar", "bio"],
          include: {
            model: User,
            as: "userInfo",
            attributes: ["username"],
            include: { model: Role, as: "role", attributes: ["slug"] },
          },
          where: { id: { [Op.ne]: me.profileInfo.id } },
        },
        {
          model: Block,
          as: "followedBlocker",
          where: { blockedId: me.profileInfo.id },
          attributes: [],
          required: false,
        },
        {
          model: Block,
          as: "followedBlocked",
          attributes: [],
          where: { blockerId: me.profileInfo.id },
          required: false,
        },
      ],
      limit: Number(limit) ? Number(limit) : null,
    });
    followeds = await Promise.all(
      followProfiles.map(async (followProfile) => {
        return {
          id: followProfile.followed.id,
          fullname: followProfile.followed.fullname,
          avatar: addUrlToImg(followProfile.followed.avatar),
          bio: followProfile.followed.bio,
          username: followProfile.followed.userInfo.username,
          role: followProfile.followed.userInfo.role.slug,
          isFollowed: !!(await Follow_Profile.findOne({
            where: {
              followedId: followProfile.followed.id,
              followerId: me.profileInfo.id,
            },
          })),
        };
      })
    );
  }

  const newSkip =
    followProfiles.length > 0
      ? followProfiles[followProfiles.length - 1].id
      : null;

  res.json({ success: true, data: followeds, newSkip });
});

// ==================== get list of follower profiles ==================== //
const getFollowers = asyncMiddleware(async (req, res, next) => {
  const me = req.me ? req.me : null;
  const user = req.user;
  const { skip = 0, limit = 15 } = req.query;

  let followerProfiles;

  let followers;

  if (!me) {
    followerProfiles = await Follow_Profile.findAll({
      where: { followedId: user.profileInfo.id, id: { [Op.gt]: skip } },
      attributes: ["id"],
      include: {
        model: Profile,
        as: "follower",
        attributes: ["id", "fullname", "avatar", "bio"],
        include: {
          model: User,
          as: "userInfo",
          attributes: ["username"],
          include: { model: Role, as: "role", attributes: ["slug"] },
        },
      },
      limit: Number(limit) ? Number(limit) : null,
    });
    followers = followerProfiles.map((followerProfile) => {
      return {
        id: followerProfile.follower.id,
        fullname: followerProfile.follower.fullname,
        avatar: addUrlToImg(followerProfile.follower.avatar),
        bio: followerProfile.follower.bio,
        username: followerProfile.follower.userInfo.username,
        role: followerProfile.follower.userInfo.role.slug,
      };
    });
  }

  if (me && me.profileInfo.id === user.profileInfo.id) {
    followerProfiles = await Follow_Profile.findAll({
      where: { followedId: user.profileInfo.id, id: { [Op.gt]: skip } },
      attributes: ["id"],
      include: {
        model: Profile,
        as: "follower",
        attributes: ["id", "fullname", "avatar", "bio"],
        include: {
          model: User,
          as: "userInfo",
          attributes: ["username"],
          include: { model: Role, as: "role", attributes: ["slug"] },
        },
      },
      limit: Number(limit) ? Number(limit) : null,
    });
    followers = await Promise.all(
      followerProfiles.map(async (followerProfile) => {
        return {
          id: followerProfile.follower.id,
          fullname: followerProfile.follower.fullname,
          avatar: addUrlToImg(followerProfile.follower.avatar),
          bio: followerProfile.follower.bio,
          username: followerProfile.follower.userInfo.username,
          role: followerProfile.follower.userInfo.role.slug,
          isFollowed: !!(await Follow_Profile.findOne({
            where: {
              followedId: followerProfile.follower.id,
              followerId: me.profileInfo.id,
            },
          })),
        };
      })
    );
  }

  if (me && me.profileInfo.id !== user.profileInfo.id) {
    followerProfiles = await Follow_Profile.findAll({
      where: {
        followedId: user.profileInfo.id,
        id: { [Op.gt]: skip },
        "$followerBlocker.blockerId$": null,
        "$followerBlocked.blockedId$": null,
      },
      attributes: ["id"],
      include: [
        {
          model: Profile,
          as: "follower",
          attributes: ["id", "fullname", "avatar", "bio"],
          include: {
            model: User,
            as: "userInfo",
            attributes: ["username"],
            include: { model: Role, as: "role", attributes: ["slug"] },
          },
          where: { id: { [Op.ne]: me.profileInfo.id } },
        },
        {
          model: Block,
          as: "followerBlocker",
          where: { blockedId: me.profileInfo.id },
          attributes: [],
          required: false,
        },
        {
          model: Block,
          as: "followerBlocked",
          attributes: [],
          where: { blockerId: me.profileInfo.id },
          required: false,
        },
      ],
      limit: Number(limit) ? Number(limit) : null,
    });
    followers = await Promise.all(
      followerProfiles.map(async (followerProfile) => {
        return {
          id: followerProfile.follower.id,
          fullname: followerProfile.follower.fullname,
          avatar: addUrlToImg(followerProfile.follower.avatar),
          bio: followerProfile.follower.bio,
          username: followerProfile.follower.userInfo.username,
          role: followerProfile.follower.userInfo.role.slug,
          isFollowed: !!(await Follow_Profile.findOne({
            where: {
              followedId: followerProfile.follower.id,
              followerId: me.profileInfo.id,
            },
          })),
        };
      })
    );
  }

  const newSkip =
    followerProfiles.length > 0
      ? followerProfiles[followerProfiles.length - 1].id
      : null;

  res.json({ success: true, data: followers, newSkip });
});

export default { followAProfile, unFollowAProfile, getFolloweds, getFollowers };
