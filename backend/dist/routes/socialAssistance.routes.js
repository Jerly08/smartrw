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
const socialAssistanceController = __importStar(require("../controllers/socialAssistance.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const socialAssistance_middleware_1 = require("../middleware/socialAssistance.middleware");
const socialAssistance_schema_1 = require("../schemas/socialAssistance.schema");
const router = express_1.default.Router();
// Get all social assistance programs (public, but with different data based on role)
router.get('/', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(socialAssistance_schema_1.searchSocialAssistanceSchema), socialAssistanceController.getAllSocialAssistance);
// Get social assistance statistics
router.get('/statistics', auth_middleware_1.authenticate, socialAssistanceController.getSocialAssistanceStatistics);
// Check eligibility for a resident
router.get('/eligibility/:residentId', auth_middleware_1.authenticate, socialAssistanceController.checkResidentEligibility);
// Get social assistance by ID (accessible by all authenticated users)
router.get('/:id', auth_middleware_1.authenticate, socialAssistance_middleware_1.checkSocialAssistanceAccess, socialAssistanceController.getSocialAssistanceById);
// Create social assistance program (only Admin and RW)
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'RW']), (0, validation_middleware_1.validateRequest)(socialAssistance_schema_1.createSocialAssistanceSchema), socialAssistanceController.createSocialAssistance);
// Update social assistance program (only Admin and RW)
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'RW']), (0, validation_middleware_1.validateRequest)(socialAssistance_schema_1.updateSocialAssistanceSchema), socialAssistanceController.updateSocialAssistance);
// Delete social assistance program (only Admin and RW)
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'RW']), socialAssistanceController.deleteSocialAssistance);
// Get recipients for a social assistance program
router.get('/:id/recipients', auth_middleware_1.authenticate, socialAssistance_middleware_1.checkSocialAssistanceAccess, socialAssistanceController.getSocialAssistanceRecipients);
// Add recipient to a social assistance program (only Admin and RW)
router.post('/:id/recipients', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'RW']), (0, validation_middleware_1.validateRequest)(socialAssistance_schema_1.addRecipientSchema), socialAssistanceController.addRecipient);
// Update recipient information (Admin, RW, and RT for their area can verify)
router.put('/:assistanceId/recipients/:recipientId', auth_middleware_1.authenticate, socialAssistance_middleware_1.checkRecipientAccess, (0, validation_middleware_1.validateRequest)(socialAssistance_schema_1.updateRecipientSchema), socialAssistanceController.updateRecipient);
// Verify recipient (Admin, RW, and RT for their area)
router.patch('/:assistanceId/recipients/:recipientId/verify', auth_middleware_1.authenticate, socialAssistance_middleware_1.checkVerificationAccess, socialAssistanceController.updateRecipient);
// Remove recipient from program (only Admin and RW)
router.delete('/:assistanceId/recipients/:recipientId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'RW']), socialAssistanceController.removeRecipient);
exports.default = router;
