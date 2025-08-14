"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const resident_routes_1 = __importDefault(require("./routes/resident.routes"));
const family_routes_1 = __importDefault(require("./routes/family.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const socialAssistance_routes_1 = __importDefault(require("./routes/socialAssistance.routes"));
const forum_routes_1 = __importDefault(require("./routes/forum.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const rt_routes_1 = __importDefault(require("./routes/rt.routes"));
const rw_routes_1 = __importDefault(require("./routes/rw.routes"));
// Middleware
const error_middleware_1 = require("./middleware/error.middleware");
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Initialize Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Add static file serving for uploads
app.use('/api/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'smart-rw-backend',
        version: '1.0.0'
    });
});
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/residents', resident_routes_1.default);
app.use('/api/families', family_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/complaints', complaint_routes_1.default);
app.use('/api/social-assistance', socialAssistance_routes_1.default);
app.use('/api/forum', forum_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/rt', rt_routes_1.default);
app.use('/api/rw', rw_routes_1.default);
// Error handling middleware
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
exports.default = app;
