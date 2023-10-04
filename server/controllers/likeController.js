const Like = require("../models/Like");
const Article = require("../models/Article");
const { ErrorResponse } = require("../response/ErrorResponse");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");

// like an article
const likeOrUnlikeAnArticle = asyncMiddleware(async (req, res, next) => {
  const { profile } = req;
  const { slug } = req.params;

  const article = await Article.findOne({ slug });
  if (!article) {
    throw new ErrorResponse(404, "article not found");
  }

  let like = await Like.findOne({ article: article._id, user: profile._id });
  if (!like) {
    like = new Like({
      article: article._id,
      profile: profile._id,
    });
    await like.save();
  } else {
    await Like.deleteOne({ _id: like._id });
  }

  res.status(200).json({
    success: true,
  });
});

module.exports = { likeOrUnlikeAnArticle };
