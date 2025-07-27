"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = exports.safeJsonParse = exports.formatDate = exports.hasPermission = void 0;
// Check if a user has permission based on role hierarchy
const hasPermission = (userRole, requiredRole) => {
    const roleHierarchy = {
        ADMIN: 3,
        RW: 2,
        RT: 1,
        WARGA: 0,
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
exports.hasPermission = hasPermission;
// Format date to Indonesian format
const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};
exports.formatDate = formatDate;
// Parse JSON safely
const safeJsonParse = (jsonString, fallback) => {
    if (!jsonString)
        return fallback;
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        return fallback;
    }
};
exports.safeJsonParse = safeJsonParse;
// Generate random string
const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
