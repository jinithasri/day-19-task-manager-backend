const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Task = require("./models/Task");
const User = require("./models/User");
const authenticateToken = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use(cors());

// ===============================
// MongoDB Connection
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error);
    });

// ===============================
// Test Route
// ===============================

app.get("/", (req, res) => {
    res.json({
        message: "Task Manager API is running!"
    });
});

// ===============================
// CREATE USER / SIGNUP
// ===============================

app.post("/users", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await user.save();

        // Never send the password back to the frontend
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create user",
            error: error.message
        });
    }
});

// ===============================
// LOGIN USER
// ===============================

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

// ===============================
// GET TASKS BY LOGGED-IN USER
// ===============================

app.get("/tasks", authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.find({
            userId: req.user.userId
        }).sort({
            createdAt: -1
        });

        res.json(tasks);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});

// ===============================
// ADD NEW TASK
// ===============================

app.post("/tasks", authenticateToken, async (req, res) => {
    try {
        const { title, category } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const task = new Task({
            title: title.trim(),
            category: category,
            userId: req.user.userId
        });

        const savedTask = await task.save();

        res.status(201).json(savedTask);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add task"
        });
    }
});

// ===============================
// UPDATE TASK
// ===============================

app.put("/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findOneAndUpdate(
            {
                _id: id,
                userId: req.user.userId
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found or you do not have permission"
            });
        }

        res.json(task);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update task"
        });
    }
});
// ===============================
// DELETE TASK
// ===============================

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findOneAndDelete({
            _id: id,
            userId: req.user.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found or you do not have permission"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete task"
        });
    }
});
// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Task Manager server running on port ${PORT}`);
});