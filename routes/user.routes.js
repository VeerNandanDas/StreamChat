import express from "express";
import { registerUser, userVerify , loginser , getMe } from "../controller/user.controller.js";
import { checkAuth } from "../middleware/auth.middleware.js"

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", checkAuth , loginser);
router.get("/verify/:token" , checkAuth ,userVerify )
router.get("/check" , checkAuth , getMe)

export default router;
