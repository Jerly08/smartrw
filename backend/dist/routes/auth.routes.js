"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController = __importStar(require("../controllers/auth.controller"));
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const auth_schema_1 = require("../schemas/auth.schema");
const router = express_1.default.Router();
// Public routes
router.post('/register', (0, validation_middleware_1.validateRequest)(auth_schema_1.registerSchema), authController.register);
router.post('/login', (0, validation_middleware_1.validateRequest)(auth_schema_1.loginSchema), authController.login);
// Protected routes
router.get('/profile', auth_middleware_1.authenticate, authController.getProfile);
router.put('/profile', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(auth_schema_1.updateProfileSchema), authController.updateProfile);
router.put('/password', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(auth_schema_1.changePasswordSchema), authController.changePassword);
// Verification routes
router.get('/rts', auth_middleware_1.authenticate, authController.getAvailableRTs);
router.post('/verify-resident', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(auth_schema_1.verifyResidentSchema), authController.verifyResident);
// Route for uploading verification documents
router.post('/upload-verification', auth_middleware_1.authenticate, (0, upload_middleware_1.uploadFields)([
    { name: 'ktp', maxCount: 1 },
    { name: 'kk', maxCount: 1 },
]), authController.uploadVerificationDocuments);
// Admin only routes
router.post('/register-admin', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), (0, validation_middleware_1.validateRequest)(auth_schema_1.registerSchema), authController.register);
exports.default = router;
