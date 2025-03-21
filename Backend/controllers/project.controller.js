import mongoose from "mongoose";
import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import { validationResult } from "express-validator";

export const createProjectController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        const { email } = req.user;

        const loggedInUser = await User.findOne({ email });
        const userId = loggedInUser._id;

        if (!name || !userId) {
            throw new Error("Name and userId are required");
        }

        const project = await Project.create({ name, users: [userId] });

        return res.status(201).json({ project });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getAllUserProjectsController = async (req, res) => {
    try {
        const { email } = req.user;

        if (!email) {
            throw new Error("Unauthorized");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }

        const projects = await Project.find({ users: user._id }).populate("users");

        return res.status(200).json({ projects });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const addUserController = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectId, users } = req.body;
        const { email } = req.user;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: "Invalid project ID" });
        }

        if (!users.every((id) => mongoose.Types.ObjectId.isValid(id))) {
            return res
                .status(400)
                .json({ error: "Invalid user ID(s) in array" });
        }

        const loggedInUser = await User.findOne({ email });
        const userId = loggedInUser._id;

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const project = await Project.findOne({
            _id: projectId,
            users: userId,
        });

        if (!project) {
            throw new Error("Project not found");
        }

        project.users.push(...users);
        await project.save();

        return res.status(200).json({ project });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getProjectByIdController = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: "Invalid project ID" });
        }

        const project = await Project.findById(projectId).populate("users");

        if (!project) {
            throw new Error("Project not found");
        }

        return res.status(200).json({ project });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


export const updateFileTree = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { fileTree } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update file tree
        project.fileTree = fileTree;
        await project.save();

        return res.status(200).json({ 
            message: 'File tree updated successfully',
            fileTree: project.fileTree 
        });
    } catch (error) {
        console.error('Error updating file tree:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getFileTree = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        return res.status(200).json({ fileTree: project.fileTree });
    } catch (error) {
        console.error('Error getting file tree:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};