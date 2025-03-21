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
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { FileTreeItem } from "../components/FileTreeItem";
import { getWebContainerInstance } from "../config/webContainer";

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
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editableContent, setEditableContent] = useState("");
    const [fileContents, setFileContents] = useState({});
    const [fileTree, setFileTree] = useState({});
    const [iframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null)

    //     const [fileTree, setFileTree] = useState({
    //         src: {
    //             type: "folder",
    //             children: {
    //                 "app.js": {
    //                     type: "file",
    //                     content: `const express = require('express');
    // const app = express();
    // // ...existing code...`,
    //                 },
    //                 config: {
    //                     type: "folder",
    //                     children: {
    //                         "db.js": {
    //                             type: "file",
    //                             content: "",
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //     });

    const { user } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const [webContainer, setWebContainer] = useState(null);
    const messageBox = createRef();

    useEffect(() => {
        initializeSocket(project._id);

        recieveMessage("project-message", (data) => {
            // Handle AI messages differently than user messages
            const messageData =
                data.sender._id === "ai"
                    ? { ...data, message: data.result || data.message } // Ensure we get the full markdown content
                    : data;

            setMessages((prev) => [...prev, messageData]);
            scrollToBottom();
        });

        const initializeWebContainer = async () => {
            try {
                const container = await getWebContainerInstance();
                setWebContainer(container);

                // Mount initial files
                await container.mount({
                    "package.json": {
                        file: {
                            contents: JSON.stringify(
                                {
                                    name: "my-project",
                                    type: "module",
                                    dependencies: {
                                        express: "^4.18.2",
                                    },
                                    scripts: {
                                        start: "node app.js",
                                    },
                                },
                                null,
                                2
                            ),
                        },
                    },
                    ...fileTree,
                });

                // Install dependencies
                const installProcess = await container.spawn("npm", [
                    "install",
                ]);
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(chunk) {
                            console.log("Install:", chunk.toString());
                        },
                    })
                );

                // Wait for install to complete
                await installProcess.exit;
                console.log(
                    "WebContainer initialized and dependencies installed"
                );
            } catch (error) {
                console.error("WebContainer initialization error:", error);
            }
        };

        if (!webContainer) {
            initializeWebContainer();
        }
    }, []);

    useEffect(() => {
        const loadProjectFiles = async () => {
            try {
                const response = await axiosInstance.get(
                    `/project/${project._id}/files`
                );
                if (response.data.fileTree) {
                    setFileTree(response.data.fileTree);
                }
            } catch (error) {
                console.error("Error loading files:", error);
            }
        };

        loadProjectFiles();
    }, [project._id]);

    useEffect(() => {
        const loadProjectFiles = async () => {
            try {
                const response = await axiosInstance.get(
                    `/project/${project._id}/files`
                );
                if (response.data.fileTree) {
                    setFileTree(response.data.fileTree);
                }
            } catch (error) {
                console.error("Error loading files:", error);
            }
        };

        loadProjectFiles();
    }, [project._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // const createFolder = () => {
    //     const folderPath = prompt("Enter folder path (e.g., src/utils):");
    //     if (folderPath) {
    //         setFileTree((prev) => {
    //             const newTree = { ...prev };
    //             setNestedValue(newTree, folderPath, {
    //                 type: "folder",
    //                 children: {},
    //             });
    //             // Save to backend
    //             saveFileTreeToBackend(newTree);
    //             return newTree;
    //         });
    //     }
    // };
    console.log(fileTree);
    const handleContentChange = (newContent) => {
        setEditableContent(newContent);
        setFileContents((prev) => ({
            ...prev,
            [currentFile]: newContent,
        }));

        setFileTree((prev) => ({
            ...prev,
            [currentFile]: {
                file: {
                    contents: newContent,
                },
            },
        }));

        saveFileTreeToBackend({
            ...fileTree,
            [currentFile]: {
                file: {
                    contents: newContent,
                },
            },
        });
    };

    const createFile = () => {
        const fileName = prompt("Enter file name (e.g., index.js):");
        if (fileName) {
            setFileTree((prev) => ({
                ...prev,
                [fileName]: {
                    file: {
                        contents: "",
                    },
                },
            }));
            saveFileTreeToBackend({
                ...fileTree,
                [fileName]: {
                    file: {
                        contents: "",
                    },
                },
            });
        }
    };

    const saveFileTreeToBackend = async (fileTree) => {
        try {
            await axiosInstance.put(`/project/${project._id}/files`, {
                fileTree,
            });
        } catch (error) {
            console.error("Error saving file tree:", error);
        }
    };

    const getNestedValue = (obj, path) => {
        const parts = path.split("/");
        let current = obj;
        for (const part of parts) {
            if (!current[part]) return null;
            current =
                current[part].type === "folder"
                    ? current[part].children
                    : current[part];
        }
        return current;
    };

    const setNestedValue = (obj, path, value) => {
        const parts = path.split("/");
        const lastPart = parts.pop();
        let current = obj;

        for (const part of parts) {
            if (!current[part]) {
                current[part] = { type: "folder", children: {} };
            }
            current = current[part].children;
        }
        current[lastPart] = value;
        return obj;
    };

    // Add this function to handle scrolling
    const scrollToBottom = () => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    };

    const handleFileOpen = (filePath, fileItem) => {
        setCurrentFile(filePath);

        // Store content in fileContents state if not already present
        if (!fileContents[filePath]) {
            setFileContents((prev) => ({
                ...prev,
                [filePath]: fileItem.file.contents,
            }));
        }

        setEditableContent(fileContents[filePath] || fileItem.file.contents);
        if (!openFiles.includes(filePath)) {
            setOpenFiles((prev) => [...prev, filePath]);
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
        try {
            // Get the markdown content from the message
            const markdownContent =
                typeof message === "string"
                    ? message
                    : message.message || message.result || "";

            return (
                <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
                    <Markdown
                        children={markdownContent}
                        options={{
                            overrides: {
                                code: {
                                    component: SyntaxHighlightedCode,
                                    props: {
                                        className: "language-javascript",
                                    },
                                },
                                // Add support for other markdown elements
                                pre: {
                                    component: ({ children, ...props }) => (
                                        <pre
                                            className="rounded-md my-2"
                                            {...props}>
                                            {children}
                                        </pre>
                                    ),
                                },
                                p: {
                                    component: ({ children, ...props }) => (
                                        <p className="my-2" {...props}>
                                            {children}
                                        </p>
                                    ),
                                },
                            },
                        }}
                    />
                </div>
            );
        } catch (error) {
            console.error("Error rendering AI message:", error);
            return (
                <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
                    <p className="text-red-400">Error displaying message</p>
                </div>
            );
        }
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
                                        WriteAiMessage(msg)
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

            <div className="right bg-[#1e1e1e] flex-grow h-full flex">
                <div className="code-explorer h-full w-56 bg-[#252526] flex flex-col border-r border-[#3c3c3c]">
                    <div className="flex justify-between items-center p-2 border-b border-[#3c3c3c]">
                        <span className="text-[#cccccc] text-sm">EXPLORER</span>
                        <button
                            onClick={createFile}
                            className="p-1.5 hover:bg-[#2d2d2d] rounded-sm transition-colors group relative"
                            title="New File">
                            <i className="ri-file-add-line text-[#cccccc] group-hover:text-[#00ffe7]"></i>
                        </button>
                    </div>

                    <div className="p-2 flex-1 overflow-y-auto">
                        {Object.entries(fileTree).map(([name, item]) => (
                            <FileTreeItem
                                key={name}
                                name={name}
                                item={item}
                                path={name}
                                onFileOpen={handleFileOpen}
                            />
                        ))}
                    </div>
                </div>

                {currentFile && (
                    <div className="code-editor flex-grow flex flex-col bg-[#1e1e1e]">
                        <div className="top flex w-full justify-between border-b border-[#3c3c3c]">
                            <div className="top flex border-b border-[#3c3c3c]">
                                {openFiles.map((file, idx) => (
                                    <button
                                        key={idx}
                                        className={`file px-4 py-2 border-r border-[#3c3c3c] flex items-center gap-2 
        ${
            currentFile === file
                ? "bg-[#1e1e1e] text-white"
                : "bg-[#2d2d2d] text-[#cccccc]"
        } 
        hover:bg-[#2d2d2d]`}
                                        onClick={() => {
                                            setCurrentFile(file);
                                            setEditableContent(
                                                fileContents[file] ||
                                                    fileTree[file].file.contents
                                            );
                                        }}>
                                        <p>{file}</p>
                                        <i
                                            className="ri-close-line hover:text-red-400"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenFiles((prev) =>
                                                    prev.filter(
                                                        (f) => f !== file
                                                    )
                                                );
                                                if (currentFile === file) {
                                                    const newCurrentFile =
                                                        openFiles[
                                                            openFiles.length - 2
                                                        ];
                                                    if (newCurrentFile) {
                                                        setCurrentFile(
                                                            newCurrentFile
                                                        );
                                                        setEditableContent(
                                                            fileContents[
                                                                newCurrentFile
                                                            ] ||
                                                                fileTree[
                                                                    newCurrentFile
                                                                ].file.contents
                                                        );
                                                    } else {
                                                        setCurrentFile(null);
                                                        setEditableContent("");
                                                    }
                                                }
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                            <button
                                className="px-4 py-2 hover:bg-[#2d2d2d] hover:text-[#00ffe7] text-white transition-colors"
                                onClick={async () => {
                                    try {
                                        // First update/mount all files in WebContainer
                                        await webContainer?.mount(fileTree);

                                        let temp = await webContainer?.spawn(
                                            "npm",
                                            ["install"]
                                        );

                                        if(runProcess){
                                            runProcess.kill();
                                        }

                                        const tempRunProcess =
                                            await webContainer?.spawn("npm", [
                                                "start",
                                            ]);



                                        tempRunProcess.output.pipeTo(
                                            new WritableStream({
                                                write(chunk) {
                                                    console.log(
                                                        "Output:",
                                                        chunk.toString()
                                                    );
                                                },
                                            })
                                        );

                                        setRunProcess(tempRunProcess);

                                        webContainer.on(
                                            "server-ready",
                                            (port, url) => {
                                                console.log(port, url);
                                                setIframeUrl(url);
                                            }
                                        );

                                        // Handle process exit
                                        runProcess.exit.then((code) => {
                                            console.log(
                                                "Process exited with code:",
                                                code
                                            );
                                        });
                                    } catch (error) {
                                        console.error(
                                            "Error running code:",
                                            error
                                        );
                                    }
                                }}>
                                Run Code
                            </button>
                        </div>

                        <div className="bottom flex-grow p-4 bg-[#1e1e1e]">
                            {isEditing ? (
                                <textarea
                                    value={editableContent}
                                    onChange={(e) =>
                                        handleContentChange(e.target.value)
                                    }
                                    className="w-full h-full bg-[#1e1e1e] text-[#cccccc] focus:outline-none font-mono p-2"
                                />
                            ) : (
                                <div onClick={() => setIsEditing(true)}>
                                    <SyntaxHighlightedCode className="javascript">
                                        {editableContent}
                                    </SyntaxHighlightedCode>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {iframeUrl && webContainer && (
                    <div className="flex flex-col h-full">
                    <div className="address-bar">
                        <input type="text"  onChange={(e) => setIframeUrl(e.target.value)}
                            value={iframeUrl} className="w-full h-10 bg-[#1e1e1e] text-[#cccccc] focus:outline-none font-mono p-2"
                        />
                    </div>
                        <iframe
                            src={iframeUrl}
                            className="w-1/2 h-full"></iframe>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Project;
