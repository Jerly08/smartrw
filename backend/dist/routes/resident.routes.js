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
const residentController = __importStar(require("../controllers/resident.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const resident_schema_1 = require("../schemas/resident.schema");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = express_1.default.Router();
// Protected routes - require authentication
router.get('/', auth_middleware_1.authenticate, residentController.getAllResidents);
router.get('/statistics', auth_middleware_1.authenticate, residentController.getResidentStatistics);
// Get residents pending verification for RT - MUST be before /:id route
router.get('/pending-verification', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT']), residentController.getPendingVerification);
// Get residents for specific RT - used in RT dashboard
router.get('/rt-residents', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT']), residentController.getResidentsForRT);
router.get('/:id', auth_middleware_1.authenticate, auth_middleware_1.checkResidentAccess, residentController.getResidentById);
// Get resident documents
router.get('/:id/documents', auth_middleware_1.authenticate, auth_middleware_1.checkResidentAccess, residentController.getResidentDocuments);
// Upload document for resident
router.post('/:id/documents/upload', auth_middleware_1.authenticate, auth_middleware_1.checkResidentAccess, (0, upload_middleware_1.uploadSingle)('document'), residentController.uploadResidentDocument);
// Get social assistance history for a resident
router.get('/:id/social-assistance', auth_middleware_1.authenticate, auth_middleware_1.checkResidentAccess, residentController.getResidentSocialAssistance);
// Routes for RT, RW, and Admin
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(resident_schema_1.createResidentSchema), residentController.createResident);
router.post('/import', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(resident_schema_1.importResidentsSchema), residentController.importResidents);
router.get('/export', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), residentController.exportResidents);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), auth_middleware_1.checkResidentAccess, (0, validation_middleware_1.validateRequest)(resident_schema_1.updateResidentSchema), residentController.updateResident);
router.patch('/:id/verify', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), auth_middleware_1.checkResidentAccess, (0, validation_middleware_1.validateRequest)(resident_schema_1.verifyResidentSchema), residentController.verifyResident);
// Verify resident by RT
router.patch('/:id/verify-by-rt', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT']), residentController.verifyByRT);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RW', 'ADMIN']), residentController.deleteResident);
exports.default = router;
