const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        enum: ["Work", "Personal", "Urgent"],
        default: "Personal"
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },

    completed: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Task", taskSchema);