import { validationResult } from "express-validator";
import User from "../models/User.model.js";
import redisClient from "../services/redis.service.js";

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        const hashedPassword = await User.hashPassword(password);
        const newUser = await User.create({ email, password: hashedPassword });

        const token = newUser.generateToken();
        delete newUser._doc.password;

        res.status(201).json({ success: true, user: newUser, token });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isValidPassword = await user.isValidPassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = await user.generateToken();
        delete user._doc.password;

        res.status(200).json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const profileController = async (req, res) => {
    console.log(req.user);

    res.status(200).json({ user: req.user });
};

export const logoutController = async (req, res) => {
    try {
        const token =
            req.headers.authorization.split(" ")[1] || req.cookies.token;

        redisClient.set(token, "logout", "EX", 60 * 60 * 24);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
