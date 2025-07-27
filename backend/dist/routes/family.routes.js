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
const familyController = __importStar(require("../controllers/family.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const family_schema_1 = require("../schemas/family.schema");
const router = express_1.default.Router();
// Protected routes - require authentication
router.get('/', auth_middleware_1.authenticate, familyController.getAllFamilies);
router.get('/:id', auth_middleware_1.authenticate, familyController.getFamilyById);
router.get('/kk/:noKK', auth_middleware_1.authenticate, familyController.getFamilyByKK);
// Routes for RT, RW, and Admin
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(family_schema_1.createFamilySchema), familyController.createFamily);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(family_schema_1.updateFamilySchema), familyController.updateFamily);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RW', 'ADMIN']), familyController.deleteFamily);
// Family member management
router.post('/:id/members', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), (0, validation_middleware_1.validateRequest)(family_schema_1.addFamilyMemberSchema), familyController.addFamilyMember);
router.delete('/:id/members/:residentId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['RT', 'RW', 'ADMIN']), familyController.removeFamilyMember);
exports.default = router;
