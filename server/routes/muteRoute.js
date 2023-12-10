import express from "express";
import muteController from "../controllers/muteController.js";
import requiredAuth from "../middlewares/requiredAuth.js";
import checkUserBanned from "../middlewares/checkUserBanned.js";
import fetchMe from "../middlewares/fetchMe.js";
import fetchUser from "../middlewares/fetchUser.js";
import checkBlockedByUser from "../middlewares/checBlockedByUser.js";

const router = express.Router();

router.get("/me", requiredAuth, fetchMe, muteController.getMutedProfiles);

router.post(
  "/:id",
  requiredAuth,
  fetchMe,
  fetchUser,
  checkUserBanned,
  checkBlockedByUser,
  muteController.muteAProfile
);

router.delete(
  "/:id",
  requiredAuth,
  fetchMe,
  fetchUser,
  muteController.unMuteAProfile
);

export default router;