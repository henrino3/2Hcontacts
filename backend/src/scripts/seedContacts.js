"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var Contact_1 = require("../models/Contact");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var dummyContacts = [
    {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        company: "Tech Corp",
        title: "Software Engineer",
        category: "Work",
        tags: ["tech", "engineering"],
        isFavorite: true,
        socialProfiles: {
            linkedin: "johndoe",
            x: "@johndoe"
        }
    },
    {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1 (555) 234-5678",
        company: "Design Studio",
        title: "UI/UX Designer",
        category: "Work",
        tags: ["design", "creative"],
        isFavorite: true,
        socialProfiles: {
            linkedin: "janesmith",
            instagram: "@janedesigns"
        }
    },
    {
        firstName: "Michael",
        lastName: "Johnson",
        email: "michael.j@example.com",
        phone: "+1 (555) 345-6789",
        company: "Marketing Pro",
        title: "Marketing Manager",
        category: "Work",
        tags: ["marketing", "management"],
        isFavorite: false,
        socialProfiles: {
            linkedin: "michaelj",
            x: "@michaelj"
        }
    },
    {
        firstName: "Sarah",
        lastName: "Williams",
        email: "sarah.w@example.com",
        phone: "+1 (555) 456-7890",
        company: "Freelance",
        title: "Content Writer",
        category: "Freelancer",
        tags: ["writing", "content"],
        isFavorite: false,
        socialProfiles: {
            linkedin: "sarahw",
            instagram: "@sarahwrites"
        }
    },
    {
        firstName: "David",
        lastName: "Brown",
        email: "david.brown@example.com",
        phone: "+1 (555) 567-8901",
        company: "Finance Plus",
        title: "Financial Advisor",
        category: "Finance",
        tags: ["finance", "consulting"],
        isFavorite: true,
        socialProfiles: {
            linkedin: "davidbrown"
        }
    }
];
function seedContacts() {
    return __awaiter(this, void 0, void 0, function () {
        var createdContacts, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 7]);
                    // Connect to MongoDB
                    return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contacts')];
                case 1:
                    // Connect to MongoDB
                    _a.sent();
                    console.log('Connected to MongoDB');
                    // Clear existing contacts
                    return [4 /*yield*/, Contact_1.Contact.deleteMany({})];
                case 2:
                    // Clear existing contacts
                    _a.sent();
                    console.log('Cleared existing contacts');
                    return [4 /*yield*/, Contact_1.Contact.create(dummyContacts)];
                case 3:
                    createdContacts = _a.sent();
                    console.log("Created ".concat(createdContacts.length, " contacts"));
                    // Log the created contacts
                    createdContacts.forEach(function (contact) {
                        console.log("Created contact: ".concat(contact.firstName, " ").concat(contact.lastName));
                    });
                    console.log('Database seeding completed successfully');
                    return [3 /*break*/, 7];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error seeding database:', error_1);
                    return [3 /*break*/, 7];
                case 5: 
                // Close the database connection
                return [4 /*yield*/, mongoose_1.default.connection.close()];
                case 6:
                    // Close the database connection
                    _a.sent();
                    console.log('Database connection closed');
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Run the seeding function
seedContacts();
