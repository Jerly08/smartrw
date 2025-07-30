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
const userController = __importStar(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const user_schema_1 = require("../schemas/user.schema");
const router = express_1.default.Router();
// Admin only routes
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), userController.getAllUsers);
// RW management routes (Admin only) - Place these BEFORE parameterized routes
router.post('/rw', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), userController.createRWUser);
router.get('/rw', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), userController.getAllRWUsers);
router.put('/rw/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), userController.updateRWUser);
router.delete('/rw/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), userController.deleteRWUser);
// Parameterized routes - Place these AFTER specific routes
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), userController.deleteUser);
router.put('/:id/role', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), (0, validation_middleware_1.validateRequest)(user_schema_1.updateUserRoleSchema), userController.updateUserRole);
// Protected routes (accessible by the user themselves or admins)
router.get('/:id', auth_middleware_1.authenticate, userController.getUserById);
router.put('/:id', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(user_schema_1.updateUserSchema), userController.updateUser);
// RT, RW, Admin routes
router.post('/:id/link-resident', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(user_schema_1.linkUserToResidentSchema), userController.linkUserToResident);
exports.default = router;
