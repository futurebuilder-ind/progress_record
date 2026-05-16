const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    exam: {
        type: String,
        required: true
    },

    themeSettings: {
        bgColor: { type: String, default: '#030712' },
        fontFamily: { type: String, default: "'Outfit', sans-serif" },
        chartType: { type: String, default: 'radar' }
    },

    subjects: [
        {
            name: String,
            topics: [
                {
                    name: String,
                    notes: { type: String, default: '' },
                    completed: { type: Boolean, default: false },
                    completedAt: { type: Date },
                    createdAt: { type: Date, default: Date.now },
                    deadline: { type: Date },
                    subtopics: [
                        {
                            name: String,
                            completed: { type: Boolean, default: false },
                            tasks: [
                                {
                                    name: String,
                                    completed: { type: Boolean, default: false }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]

});

module.exports = mongoose.model("User", UserSchema);