import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "./models/Project.model.js";
import { generatePrompt } from "./services/ai.service.js";

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.use(async (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers.authorization?.split(" ")[1];
        const projectId = socket.handshake.query.projectId;

        // First check token
        if (!token) {
            return next(new Error("Authentication required"));
        }

        // Verify user token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error("Invalid token"));
        }
        socket.user = decoded;

        // Only check project if projectId is provided
        if (projectId) {
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return next(new Error("Invalid project ID format"));
            }

            const project = await Project.findById(projectId);
            if (!project) {
                return next(new Error("Project not found"));
            }

            socket.project = project;
        }
        next();
    } catch (error) {
        console.error("Socket middleware error:", error);
        next(new Error(`Connection error: ${error.message}`));
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.user.email);

    // Handle project-specific events only if project is set
    if (socket.project) {
        socket.roomId = socket.project._id.toString();
        socket.join(socket.roomId);

        socket.on("project-message", async (data) => {
            try {
                const message = data.message;
                const projectId = socket.project._id;

                // Emit to everyone EXCEPT sender
                socket.broadcast
                    .to(socket.roomId)
                    .emit("project-message", data);

                if (message.includes("@ai")) {
                    const prompt = message.replace("@ai", "").trim();
                    const result = await generatePrompt(
                        prompt,
                        projectId,
                        data.conversationHistory
                    );

                    // Emit AI response to everyone INCLUDING sender
                    io.to(socket.roomId).emit("project-message", {
                        result, 
                        sender: { _id: "ai", email: "AI Assistant" },
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (error) {
                console.error("AI message error:", error);
                socket.emit("error", {
                    message: "Failed to process AI request",
                });
            }
        });
    }

    socket.on("disconnect", () => {
        if (socket.roomId) {
            socket.leave(socket.roomId);
            console.log(`Left project room: ${socket.roomId}`);
        }
        console.log("User disconnected:", socket.user.email);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
