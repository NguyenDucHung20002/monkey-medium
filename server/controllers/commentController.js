import Comment from "../models/mysql/Comment.js";
import Article from "../models/mysql/Article.js";
import addUrlToImg from "../utils/addUrlToImg.js";
import asyncMiddleware from "../middlewares/asyncMiddleware.js";
import ErrorResponse from "../responses/ErrorResponse.js";
import Profile from "../models/mysql/Profile.js";
import Block from "../models/mysql/Block.js";
import User from "../models/mysql/User.js";
import { Op } from "sequelize";

// ==================== add comment ==================== //
const createComment = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const { id } = req.params;
  const { parentCommentId, content } = req.body;

  const article = await Article.findByPk(id);

  if (!article) throw ErrorResponse(404, "Article not found");

  let newCommentData = {
    articleId: article.id,
    authorId: me.profileInfo.id,
    content,
  };

  if (parentCommentId) {
    const parentComment = await Comment.findByPk(parentCommentId, {
      attributes: ["id", "depth"],
    });

    if (!parentComment) throw ErrorResponse(404, "Comment not found");

    newCommentData = {
      ...newCommentData,
      parentCommentId,
      depth: parentComment.depth + 1,
    };

    await parentComment.increment({ repliesCount: 1 });
  }

  const [newComment] = await Promise.all([
    Comment.create(newCommentData),
    article.increment({ commentsCount: 1 }),
  ]);

  const isAuthor = me.profileInfo.id === article.authorId;

  res.status(201).json({
    success: true,
    data: {
      id: newComment.id,
      repliesCount: newComment.repliesCount,
      content: newComment.content,
      depth: newComment.depth,
      author: {
        fullname: me.profileInfo.fullname,
        username: me.username,
        avatar: me.profileInfo.avatar,
        isAuthor,
      },
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
      isMyComment: true,
    },
  });
});

// ==================== update comment ==================== //
const updateComment = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const { id } = req.params;
  const { content } = req.body;

  const comment = await Comment.findOne({
    where: { id, authorId: me.profileInfo.id },
    attributes: ["id"],
  });

  if (!comment) throw ErrorResponse(404, "Comment not found");

  await comment.update({ content });

  res.json({ success: true, message: "Comment updated successfully" });
});

// ==================== delete comment ==================== //
const deleteComment = asyncMiddleware(async (req, res, next) => {
  const me = req.me;
  const { id } = req.params;

  const deleteCommentAndReplies = async (comment) => {
    const replyComments = await Comment.findAll({
      where: { parentCommentId: comment.id },
      attributes: ["id", "articleId", "parentCommentId"],
    });

    await Promise.all(
      replyComments.map(async (replyComment) => {
        deleteCommentAndReplies(replyComment);
        Comment.destroy({ where: { id: replyComment.id } });
        Article.increment(
          { commentsCount: -1 },
          { where: { id: replyComment.articleId } }
        );
      })
    );
  };

  const comment = await Comment.findOne({
    where: { id, authorId: me.profileInfo.id },
    attributes: ["id", "articleId", "parentCommentId"],
  });

  if (comment) {
    await Promise.all([
      deleteCommentAndReplies(comment),
      comment.destroy(),
      Article.increment(
        { commentsCount: -1 },
        { where: { id: comment.articleId } }
      ),
      Comment.increment(
        { repliesCount: -1 },
        { where: { id: comment.parentCommentId } }
      ),
    ]);
  }

  res.json({
    success: true,
    message: "Comment deleted successfully",
  });
});

// ==================== get article main comments ==================== //
const getMainComments = asyncMiddleware(async (req, res, next) => {
  const me = req.me ? req.me : null;
  const { id } = req.params;
  const { skip, limit = 15 } = req.query;

  const article = await Article.findByPk(id);

  if (!article) throw ErrorResponse(404, "Article not found");

  let whereQuery = { articleId: article.id, depth: 1 };

  if (skip) whereQuery.id = { [Op.lt]: skip };

  let comments;

  if (me) {
    whereQuery["$authorBlocker.blockerId$"] = null;
    whereQuery["$authorBlocked.blockedId$"] = null;
    comments = await Comment.findAll({
      where: whereQuery,
      attributes: { exclude: ["articleId", "authorId"] },
      include: [
        {
          model: Profile,
          as: "author",
          attributes: ["id", "fullname", "avatar"],
          include: {
            model: User,
            as: "userInfo",
            attributes: ["username"],
          },
        },
        {
          model: Block,
          as: "authorBlocker",
          where: { blockedId: me.profileInfo.id },
          attributes: [],
          required: false,
        },
        {
          model: Block,
          as: "authorBlocked",
          where: { blockerId: me.profileInfo.id },
          attributes: [],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit: Number(limit) ? Number(limit) : null,
    });
    comments = comments.map((comment) => {
      comment.author.avatar = addUrlToImg(comment.author.avatar);
      const isAuthor = comment.authorId === article.authorId;
      const isMyComment = me === comment.authorId;
      return {
        id: comment.id,
        parentCommentId: comment.parentCommentId
          ? comment.parentCommentId
          : null,
        repliesCount: comment.repliesCount,
        depth: comment.depth,
        author: {
          id: comment.author.id,
          fullname: comment.author.fullname,
          avatar: comment.author.avatar,
          username: comment.author.userInfo.username,
          isAuthor,
        },
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isMyComment,
      };
    });
  } else {
    comments = await Comment.findAll({
      where: whereQuery,
      attributes: { exclude: ["articleId", "authorId"] },
      include: [
        {
          model: Profile,
          as: "author",
          attributes: ["id", "fullname", "avatar"],
          include: {
            model: User,
            as: "userInfo",
            attributes: ["username"],
          },
        },
      ],
      order: [["id", "DESC"]],
      limit: Number(limit) ? Number(limit) : null,
    });
    comments = comments.map((comment) => {
      comment.author.avatar = addUrlToImg(comment.author.avatar);
      const isAuthor = comment.authorId === article.authorId;
      return {
        id: comment.id,
        parentCommentId: comment.parentCommentId
          ? comment.parentCommentId
          : null,
        repliesCount: comment.repliesCount,
        depth: comment.depth,
        author: {
          id: comment.author.id,
          fullname: comment.author.fullname,
          avatar: comment.author.avatar,
          username: comment.author.userInfo.username,
          isAuthor,
        },
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    });
  }

  const newSkip = comments.length > 0 ? comments[comments.length - 1].id : null;

  res.json({ success: true, data: comments, newSkip });
});

// ==================== get article nested comments of main comment ==================== //
const getNestedComments = asyncMiddleware(async (req, res, next) => {
  const me = req.me ? req.me : null;
  const { id } = req.params;
  const { skip, limit = 15 } = req.query;

  const parentComment = await Comment.findByPk(id);

  if (!parentComment) throw ErrorResponse(404, "Comment not found");

  const article = await Article.findByPk(parentComment.articleId, {
    attributes: ["id"],
  });

  if (!article) throw ErrorResponse(404, "Article not found");

  let whereQuery = { parentCommentId: parentComment.id };

  if (skip) whereQuery.id = { [Op.lt]: skip };

  let replyComments;

  if (me) {
    whereQuery["$authorBlocker.blockerId$"] = null;
    whereQuery["$authorBlocked.blockedId$"] = null;
    replyComments = await Comment.findAll({
      where: whereQuery,
      attributes: { exclude: ["articleId", "authorId"] },
      include: [
        {
          model: Profile,
          as: "author",
          attributes: ["id", "fullname", "avatar"],
          include: {
            model: User,
            as: "userInfo",
            attributes: ["username"],
          },
        },
        {
          model: Block,
          as: "authorBlocker",
          where: { blockedId: me.profileInfo.id },
          attributes: [],
          required: false,
        },
        {
          model: Block,
          as: "authorBlocked",
          where: { blockerId: me.profileInfo.id },
          attributes: [],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit: Number(limit) ? Number(limit) : null,
    });
    replyComments = replyComments.map((replyComment) => {
      replyComment.author.avatar = addUrlToImg(replyComment.author.avatar);
      const isAuthor = replyComment.authorId === article.authorId;
      const isMyComment = me === replyComment.authorId;
      return {
        id: replyComment.id,
        parentCommentId: replyComment.parentCommentId
          ? replyComment.parentCommentId
          : null,
        repliesCount: replyComment.repliesCount,
        depth: replyComment.depth,
        author: {
          id: replyComment.author.id,
          fullname: replyComment.author.fullname,
          avatar: replyComment.author.avatar,
          username: replyComment.author.userInfo.username,
          isAuthor,
        },
        content: replyComment.content,
        createdAt: replyComment.createdAt,
        updatedAt: replyComment.updatedAt,
        isMyComment,
      };
    });
  } else {
    replyComments = await Comment.findAll({
      where: whereQuery,
      attributes: { exclude: ["articleId", "authorId"] },
      include: [
        {
          model: Profile,
          as: "author",
          attributes: ["id", "fullname", "avatar"],
          include: {
            model: User,
            as: "userInfo",
            attributes: ["username"],
          },
        },
      ],
      order: [["id", "DESC"]],
      limit: Number(limit) ? Number(limit) : null,
    });
    replyComments = replyComments.map((replyComment) => {
      replyComment.author.avatar = addUrlToImg(
        replyCommentcomment.author.avatar
      );
      const isAuthor = replyComment.authorId === article.authorId;
      return {
        id: replyComment.id,
        parentCommentId: replyComment.parentCommentId
          ? replyComment.parentCommentId
          : null,
        repliesCount: replyComment.repliesCount,
        depth: replyComment.depth,
        author: {
          id: replyComment.author.id,
          fullname: replyComment.author.fullname,
          avatar: replyComment.author.avatar,
          username: replyComment.author.userInfo.username,
          isAuthor,
        },
        content: replyComment.content,
        createdAt: replyComment.createdAt,
        updatedAt: replyComment.updatedAt,
      };
    });
  }

  const newSkip =
    replyComments.length > 0
      ? replyComments[replyComments.length - 1].id
      : null;

  res.json({ success: true, data: replyComments, newSkip });
});

export default {
  createComment,
  updateComment,
  deleteComment,
  getMainComments,
  getNestedComments,
};
