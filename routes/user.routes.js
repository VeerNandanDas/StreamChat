import express from "express";
import { registerUser, userVerify , loginser } from "../controller/user.controller.js";
import { checkAuth } from "../middleware/auth.middleware.js"

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginser);
router.get("/verify/:token" ,userVerify )
router.get("/check" , checkAuth , (req,res)=>{
   return res.json({ msg : "user is good"})
})

export default router;
