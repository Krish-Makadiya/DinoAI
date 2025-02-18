import React, {
    createRef,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../config/axios";
import {
    initializeSocket,
    recieveMessage,
    sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from "markdown-to-jsx";
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';


function SyntaxHighlightedCode(props) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            hljs.highlightElement(ref.current);
        }
    }, [props.children]);

    return (
        <pre className="rounded-md p-2 bg-[#282c34]">
            <code ref={ref} className={props.className}>
                {props.children}
            </code>
        </pre>
    );
}

const Project = ({ navigate }) => {
    const location = useLocation();

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState("");

    const { user } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const messageBox = createRef();

    useEffect(() => {
        initializeSocket(project._id);

        recieveMessage("project-message", (data) => {
            setMessages((prev) => [...prev, data]);
            scrollToBottom();
        });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Add this function to handle scrolling
    const scrollToBottom = () => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    };

    const users = [
        {
            _id: "67b2b51847d2aef8e80242c4",
            email: "test@3.com",
        },
        
    ];

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            }
            return [...prev, userId];
        });
    };

    const addUserHandler = () => {
        axiosInstance
            .put("/project/add-user", {
                projectId: location.state.project._id,
                users: selectedUsers,
            })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));

        setShowUsersModal(false);
        console.log("selectedUsers", selectedUsers);
    };

    const sendMessageHandler = (event) => {
        event.preventDefault();

        sendMessage("project-message", {
            message,
            sender: user,
        });
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: user, message },
        ]); // Update messages state
        setMessage("");
        scrollToBottom();
    };

    function WriteAiMessage(message) {
        return (
            <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2" style={{
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                "::WebkitScrollbar": {
                    display: "none",
                },
            }}>
                <Markdown
                    children={message}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex">
            <div className="h-full relative flex flex-col w-[350px] bg-red-200">
                <header className="flex h-[8%] justify-between w-full bg-sky-100 px-4 py-2">
                    <button
                        onClick={() => setShowUsersModal(true)}
                        className="flex items-center gap-1">
                        <i className="ri-add-large-fill"></i>
                        <p className="text-sm">Add Collaboration</p>
                    </button>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                <div className="flex flex-col h-[92%]">
                    <div
                        ref={messageBox}
                        className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scroll-smooth"
                        style={{
                            msOverflowStyle: "none",
                            scrollbarWidth: "none",
                            "::WebkitScrollbar": {
                                display: "none",
                            },
                        }}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${
                                    msg.sender._id === "ai"
                                        ? "max-w-80"
                                        : "max-w-68"
                                } ${
                                    msg.sender._id == user._id.toString() &&
                                    "ml-auto"
                                }  message flex flex-col p-2 bg-slate-50 w-fit rounded-md break-words`}>
                                <small className="opacity-65 text-xs">
                                    {msg.sender.email}
                                </small>
                                <div className="text-sm">
                                    {msg.sender._id === "ai" ? (
                                        WriteAiMessage(msg.message)
                                    ) : (
                                        <p>{msg.message}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form
                        onSubmit={(e) => sendMessageHandler(e)}
                        className="w-full flex">
                        <input
                            type="text"
                            placeholder="Enter message"
                            className="bg-slate-100 py-2 px-4 flex-grow"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button className="bg-red-400 px-4 py-2" type="submit">
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </form>
                </div>

                <div
                    className={`side-panel w-full h-full bg-[#1e1e1e] absolute ${
                        isSidePanelOpen
                            ? "transition-all ease-in-out duration-300 left-0"
                            : "transition-all ease-in-out duration-300 -left-100"
                    }`}>
                    <header className="flex justify-end w-full bg-sky-100 p-4">
                        <button
                            onClick={() =>
                                setIsSidePanelOpen(!isSidePanelOpen)
                            }>
                            <i className="ri-close-large-line"></i>
                        </button>
                    </header>

                    <div className="flex flex-col gap-4 p-4 w-full">
                        {location.state.project.users.map((user, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 p-3 bg-[#2d2d2d] rounded-lg hover:border-[#00ffe7] border border-[#00ffe7]/20 transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border-2 border-[#00ffe7] flex items-center justify-center flex-shrink-0">
                                    <i className="ri-user-3-line text-[#00ffe7] text-xl"></i>
                                </div>
                                <p className="text-white text-sm truncate">
                                    {user.email}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {showUsersModal && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                        onClick={() => setShowUsersModal(false)}>
                        <div
                            className="bg-[#1e1e1e] p-6 rounded-lg border border-[#00ffe7] w-[480px]"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-lg font-medium">
                                    Select Users
                                </h3>
                                <button
                                    onClick={() => setShowUsersModal(false)}
                                    className="text-gray-400 hover:text-white">
                                    <i className="ri-close-line text-xl"></i>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                                {users.map((user, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() =>
                                            toggleUserSelection(user._id)
                                        }
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 
                                        ${
                                            selectedUsers.includes(user._id)
                                                ? "bg-[#00ffe7]/20 border-[#00ffe7]"
                                                : "bg-[#2d2d2d] border-[#00ffe7]/20"
                                        } border hover:border-[#00ffe7]`}>
                                        <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border-2 border-[#00ffe7] flex items-center justify-center flex-shrink-0">
                                            <i className="ri-user-3-line text-[#00ffe7]"></i>
                                        </div>
                                        <p className="text-white text-sm truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowUsersModal(false)}
                                    className="px-4 py-2 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#2d2d2d]/80">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => addUserHandler()}
                                    className="px-4 py-2 rounded-lg bg-[#00ffe7] text-[#1e1e1e] font-medium hover:bg-[#00ffe7]/80">
                                    Add Users
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div></div>
        </div>
    );
};

export default Project;
