import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            maxlength: [50, "Project name cannot exceed 50 characters"],
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        fileTree: {
            type: Object,
            default: {
                "app.js": {
                    file: {
                        contents: `const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});`
                    }
                },
                "package.json": {
                    file: {
                        contents: `{
  "name": "temp-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node app.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "express": "^4.18.2"
  }
}`
                    }
                }
            }
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Project", projectSchema);
