import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
};

userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function() {
    return jwt.sign({ email: this.email }, process.env.JWT_SECRET, {
        expiresIn: "24h",
    });
};

const User = mongoose.model("User", userSchema);
export default User;
