import React, { useContext, useEffect, useState } from "react";
import axiosInstance from "../config/axios";
import { UserContext } from "../context/user.context";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const { user } = useContext(UserContext);
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [allProjects, setAllProjects] = useState([]);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        // Check if user is authenticated
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch projects only if user is authenticated
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                const response = await axiosInstance.get("/project/all-user-projects");
                setAllProjects(response.data.projects);
            } catch (error) {
                console.error("Failed to fetch projects:", error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [user, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Project Name:", projectName);

        axiosInstance
            .post("/project/create", { name: projectName })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));

        setShowModal(false);
        setProjectName("");
    };

    return (
        <div className="h-screen w-full bg-[#1e1e1e]">
        {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-[#00ffe7] text-xl">Loading...</div>
                </div>
            ) : (
                <>
            <button
                onClick={() => setShowModal(true)}
                className="bg-[#00ffe7] hover:bg-[#00ffe7]/90 text-[#1e1e1e] px-8 py-3 rounded-lg shadow-md font-medium m-5">
                Create Project
            </button>

            {allProjects.map((project) => (
                <div
                    key={project._id}
                    onClick={() => {
                        navigate(`/project`, { state: { project } });
                    }}
                    className="bg-[#2d2d2d] p-8 w-fit rounded-lg border-[1px] border-[#00ffe7] mt-5">
                    <h2 className="text-[#00ffe7] text-lg font-semibold mb-2">
                        {project.name}
                    </h2>
                    <p className="text-white">
                        Project Users: {project.users.length}
                    </p>
                    <p className="text-white">Project ID: {project._id}</p>
                </div>
            ))}

            {showModal && (
                <div
                    className="fixed inset-0 bg-[#1e1e1e]/50 backdrop-blur-[1px] flex items-center justify-center"
                    onClick={() => setShowModal(false)}>
                    <div
                        className="bg-[#1e1e1e] p-8 rounded-lg border-[1px] border-[#00ffe7]"
                        onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Project Name"
                                className="bg-[#2d2d2d] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ffe7]"
                                required
                            />
                            <div className="mt-4 flex gap-4">
                                <button
                                    type="submit"
                                    className="bg-[#00ffe7] hover:bg-[#00ffe7]/90 text-[#1e1e1e] px-4 py-2 rounded-lg shadow-md font-medium">
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-[#2d2d2d] hover:bg-[#2d2d2d]/90 text-white px-4 py-2 rounded-lg shadow-md font-medium">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </>
        )}
        </div>
    );
};

export default Home;
