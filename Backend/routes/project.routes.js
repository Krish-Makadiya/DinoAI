import { authUser } from "../middleware/auth.middleware.js";
import { body } from "express-validator";
import { Router } from "express";
import {
    addUserController,
    createProjectController,
    getAllUserProjectsController,
    getFileTree,
    getProjectByIdController,
    updateFileTree,
} from "../controllers/project.controller.js";

const router = Router();

router.post(
    "/create",
    body("name").isString().withMessage("Name is required"),
    authUser,
    createProjectController
);

router.get("/all-user-projects", authUser, getAllUserProjectsController);

router.put(
    "/add-user",

    body("projectId").isString().withMessage("ProjectId is required"),
    body("users")
        .isArray()
        .withMessage("Users must be an array")
        .custom((value) => {
            return value.every((item) => typeof item === "string");
        })
        .withMessage("Users must be an array of strings"),

    authUser,
    addUserController
);

router.get("/get-project/:projectId", authUser, getProjectByIdController);

router.put('/:projectId/files', authUser, updateFileTree);
router.get('/:projectId/files', authUser, getFileTree);

export default router;
