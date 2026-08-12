const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Task = require("./models/Task");

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
// GET ALL TASKS
// ===============================

app.get("/tasks", async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });

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

app.post("/tasks", async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const task = new Task({
            title: title.trim()
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

app.put("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
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

app.delete("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
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