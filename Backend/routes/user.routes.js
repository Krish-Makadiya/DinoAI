import { Router } from "express";
import {
    createUserController,
    loginUserController,
    logoutController,
    profileController,
} from "../controllers/user.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { body } from "express-validator";

const router = Router();

router.post(
    "/register",
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    createUserController
);

router.post(
    "/login",
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    loginUserController
);

router.get("/profile", authUser, profileController);

router.get("/logout", authUser, logoutController);

export default router;
