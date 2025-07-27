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
const documentController = __importStar(require("../controllers/document.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const document_middleware_1 = require("../middleware/document.middleware");
const document_schema_1 = require("../schemas/document.schema");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = express_1.default.Router();
// Protected routes - require authentication
router.get('/', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(document_schema_1.searchDocumentsSchema), documentController.getAllDocuments);
router.get('/statistics', auth_middleware_1.authenticate, documentController.getDocumentStatistics);
router.get('/:id', auth_middleware_1.authenticate, document_middleware_1.checkDocumentAccess, documentController.getDocumentById);
// Add route to download document attachment
router.get('/:id/attachments/:filename', auth_middleware_1.authenticate, document_middleware_1.checkDocumentAccess, documentController.downloadAttachment);
// Create document - all authenticated users can create documents
router.post('/', auth_middleware_1.authenticate, (0, upload_middleware_1.uploadMultiple)('attachments', 5), // Allow up to 5 file attachments
documentController.createDocument);
// Update document - only the requester can update their own documents
router.put('/:id', auth_middleware_1.authenticate, document_middleware_1.checkDocumentAccess, (0, upload_middleware_1.uploadMultiple)('attachments', 5), // Allow up to 5 file attachments
(0, validation_middleware_1.validateRequest)(document_schema_1.updateDocumentSchema), documentController.updateDocument);
// Process document - RT, RW, and Admin can process documents
router.post('/:id/process', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), document_middleware_1.checkDocumentProcessAccess, (0, validation_middleware_1.validateRequest)(document_schema_1.processDocumentSchema), documentController.processDocument);
// Delete document - only the requester can delete their own documents
router.delete('/:id', auth_middleware_1.authenticate, document_middleware_1.checkDocumentAccess, documentController.deleteDocument);
exports.default = router;
