import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axios";
import { UserContext } from "../context/user.context";

const Register = () => {
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        console.log("Form submitted:", formData);

        axiosInstance
            .post("/user/register", {
                email: formData.email,
                password: formData.password,
            })
            .then((response) => {
                localStorage.setItem("token", response.data.token);
                setUser(response.data.user);
                navigate("/");
            })
            .catch((error) => {
                console.log(error);
            });
            console.log("Form submitted:", formData);
        setFormData({
            email: "",
            password: "",
            confirmPassword: "",
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e] p-4">
            <div className="w-full max-w-md space-y-8 bg-[#2d2d2d] p-8 rounded-lg shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-[#f5f5f5] mb-2">
                        Create Account
                    </h1>
                    <p className="text-[#a0a0a0] text-sm">
                        Join DinoAI and start your journey
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-6 slect-none">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[#f5f5f5] text-sm font-medium block mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#3d3d3d] border border-[#4d4d4d] rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#00ffe7]"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[#f5f5f5] text-sm font-medium block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#3d3d3d] border border-[#4d4d4d] rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#00ffe7]"
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[#f5f5f5] text-sm font-medium block mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-[#3d3d3d] border border-[#4d4d4d] rounded-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#00ffe7]"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            className="w-full bg-[#00ffe7] hover:bg-[#00e6d0] text-[#1e1e1e] font-medium py-3 px-4 rounded-md transition duration-200">
                            Create Account
                        </button>

                        <div className="text-center">
                            <span className="text-[#a0a0a0] text-sm">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="text-[#00ffe7] hover:text-[#00e6d0] font-medium">
                                    Sign in here
                                </button>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
