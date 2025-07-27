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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFamilyMember = exports.addFamilyMember = exports.deleteFamily = exports.updateFamily = exports.createFamily = exports.getFamilyByKK = exports.getFamilyById = exports.getAllFamilies = void 0;
const familyService = __importStar(require("../services/family.service"));
const error_middleware_1 = require("../middleware/error.middleware");
// Get all families
const getAllFamilies = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search, rtNumber, rwNumber } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum)) {
            throw new error_middleware_1.ApiError('Invalid pagination parameters', 400);
        }
        const result = yield familyService.getAllFamilies({
            page: pageNum,
            limit: limitNum,
            search: search,
            rtNumber: rtNumber,
            rwNumber: rwNumber,
        });
        res.status(200).json({
            status: 'success',
            results: result.families.length,
            totalPages: result.totalPages,
            currentPage: pageNum,
            totalItems: result.totalItems,
            data: {
                families: result.families,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllFamilies = getAllFamilies;
// Get family by ID
const getFamilyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyId = parseInt(req.params.id);
        if (isNaN(familyId)) {
            throw new error_middleware_1.ApiError('Invalid family ID', 400);
        }
        const family = yield familyService.getFamilyById(familyId);
        res.status(200).json({
            status: 'success',
            data: {
                family,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getFamilyById = getFamilyById;
// Get family by KK number
const getFamilyByKK = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { noKK } = req.params;
        if (!noKK) {
            throw new error_middleware_1.ApiError('KK number is required', 400);
        }
        const family = yield familyService.getFamilyByKK(noKK);
        res.status(200).json({
            status: 'success',
            data: {
                family,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getFamilyByKK = getFamilyByKK;
// Create family
const createFamily = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyData = req.body;
        const newFamily = yield familyService.createFamily(familyData);
        res.status(201).json({
            status: 'success',
            message: 'Family created successfully',
            data: {
                family: newFamily,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createFamily = createFamily;
// Update family
const updateFamily = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyId = parseInt(req.params.id);
        if (isNaN(familyId)) {
            throw new error_middleware_1.ApiError('Invalid family ID', 400);
        }
        const familyData = req.body;
        const updatedFamily = yield familyService.updateFamily(familyId, familyData);
        res.status(200).json({
            status: 'success',
            message: 'Family updated successfully',
            data: {
                family: updatedFamily,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateFamily = updateFamily;
// Delete family
const deleteFamily = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyId = parseInt(req.params.id);
        if (isNaN(familyId)) {
            throw new error_middleware_1.ApiError('Invalid family ID', 400);
        }
        yield familyService.deleteFamily(familyId);
        res.status(200).json({
            status: 'success',
            message: 'Family deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteFamily = deleteFamily;
// Add member to family
const addFamilyMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyId = parseInt(req.params.id);
        const { residentId, familyRole } = req.body;
        if (isNaN(familyId) || isNaN(parseInt(residentId))) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        if (!familyRole) {
            throw new error_middleware_1.ApiError('Family role is required', 400);
        }
        const updatedResident = yield familyService.addFamilyMember(familyId, parseInt(residentId), familyRole);
        res.status(200).json({
            status: 'success',
            message: 'Member added to family successfully',
            data: {
                resident: updatedResident,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.addFamilyMember = addFamilyMember;
// Remove member from family
const removeFamilyMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyId = parseInt(req.params.id);
        const residentId = parseInt(req.params.residentId);
        if (isNaN(familyId) || isNaN(residentId)) {
            throw new error_middleware_1.ApiError('Invalid ID parameters', 400);
        }
        const updatedResident = yield familyService.removeFamilyMember(familyId, residentId);
        res.status(200).json({
            status: 'success',
            message: 'Member removed from family successfully',
            data: {
                resident: updatedResident,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.removeFamilyMember = removeFamilyMember;
