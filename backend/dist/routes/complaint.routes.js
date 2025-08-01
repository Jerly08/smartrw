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
const complaintController = __importStar(require("../controllers/complaint.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const complaint_middleware_1 = require("../middleware/complaint.middleware");
const complaint_schema_1 = require("../schemas/complaint.schema");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = express_1.default.Router();
// Get all complaints
router.get('/', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(complaint_schema_1.searchComplaintsSchema), complaintController.getAllComplaints);
// Get complaint statistics
router.get('/statistics', auth_middleware_1.authenticate, complaintController.getComplaintStatistics);
// Get complaint by ID
router.get('/:id', auth_middleware_1.authenticate, complaint_middleware_1.checkComplaintAccess, complaintController.getComplaintById);
// Create complaint - all authenticated users can create complaints
router.post('/', auth_middleware_1.authenticate, (0, upload_middleware_1.uploadMultiple)('attachments', 5), // Allow up to 5 file attachments
// validateRequest(createComplaintSchema), // Temporarily disabled for debugging
complaintController.createComplaint);
// Update complaint - only complaint creator, RT (for their RT), RW, and Admin can update complaints
router.put('/:id', auth_middleware_1.authenticate, complaint_middleware_1.checkComplaintUpdateAccess, (0, upload_middleware_1.uploadMultiple)('attachments', 5), // Allow up to 5 file attachments
(0, validation_middleware_1.validateRequest)(complaint_schema_1.updateComplaintSchema), complaintController.updateComplaint);
// Delete complaint - only complaint creator (if still in DITERIMA status), RW, and Admin can delete complaints
router.delete('/:id', auth_middleware_1.authenticate, complaintController.deleteComplaint);
// Respond to complaint - only RT (for their RT), RW, and Admin can respond to complaints
router.post('/:id/respond', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), complaint_middleware_1.checkComplaintRespondAccess, (0, validation_middleware_1.validateRequest)(complaint_schema_1.respondComplaintSchema), complaintController.respondToComplaint);
// Download complaint attachment
router.get('/:id/attachments/:filename', auth_middleware_1.authenticate, complaint_middleware_1.checkComplaintAccess, complaintController.downloadAttachment);
exports.default = router;
