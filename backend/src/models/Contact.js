"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
var mongoose_1 = require("mongoose");
var contactSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
    },
    company: {
        type: String,
        trim: true,
    },
    title: {
        type: String,
        trim: true,
    },
    notes: String,
    category: {
        type: String,
        trim: true,
    },
    tags: [{
            type: String,
            trim: true,
        }],
    socialProfiles: {
        type: Map,
        of: String,
        default: {},
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    lastSyncedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
contactSchema.index({ userId: 1, lastName: 1, firstName: 1 });
contactSchema.index({ userId: 1, email: 1 });
contactSchema.index({ userId: 1, phone: 1 });
contactSchema.index({ userId: 1, tags: 1 });
contactSchema.index({ userId: 1, category: 1 });
// Update lastSyncedAt on save
contactSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.lastSyncedAt = new Date();
    }
    next();
});
exports.Contact = (0, mongoose_1.model)('Contact', contactSchema);
