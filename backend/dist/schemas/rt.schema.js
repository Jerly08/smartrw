"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRTSchema = exports.createRTSchema = void 0;
const zod_1 = require("zod");
// Create RT schema
exports.createRTSchema = zod_1.z.object({
    number: zod_1.z.string({
        required_error: 'RT number is required',
    }).regex(/^[0-9]{3}$/, {
        message: 'RT number must be 3 digits (e.g., "001")',
    }),
    name: zod_1.z.string({
        invalid_type_error: 'RT name must be a string',
    }).min(3, {
        message: 'RT name must be at least 3 characters',
    }).max(100, {
        message: 'RT name cannot exceed 100 characters',
    }).optional(),
    description: zod_1.z.string({
        invalid_type_error: 'Description must be a string',
    }).max(500, {
        message: 'Description cannot exceed 500 characters',
    }).optional(),
    address: zod_1.z.string({
        invalid_type_error: 'Address must be a string',
    }).min(10, {
        message: 'Address must be at least 10 characters',
    }).max(200, {
        message: 'Address cannot exceed 200 characters',
    }).optional(),
    chairperson: zod_1.z.string({
        invalid_type_error: 'Chairperson name must be a string',
    }).min(3, {
        message: 'Chairperson name must be at least 3 characters',
    }).max(100, {
        message: 'Chairperson name cannot exceed 100 characters',
    }).optional(),
    phoneNumber: zod_1.z.string({
        invalid_type_error: 'Phone number must be a string',
    }).regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
        message: 'Please enter a valid Indonesian phone number',
    }).optional(),
    email: zod_1.z.string({
        invalid_type_error: 'Email must be a string',
    }).email({
        message: 'Please enter a valid email address',
    }).optional(),
    isActive: zod_1.z.boolean({
        invalid_type_error: 'isActive must be a boolean',
    }).optional().default(true),
});
// Update RT schema
exports.updateRTSchema = zod_1.z.object({
    number: zod_1.z.string({
        invalid_type_error: 'RT number must be a string',
    }).regex(/^[0-9]{3}$/, {
        message: 'RT number must be 3 digits (e.g., "001")',
    }).optional(),
    name: zod_1.z.string({
        invalid_type_error: 'RT name must be a string',
    }).min(3, {
        message: 'RT name must be at least 3 characters',
    }).max(100, {
        message: 'RT name cannot exceed 100 characters',
    }).nullable().optional(),
    description: zod_1.z.string({
        invalid_type_error: 'Description must be a string',
    }).max(500, {
        message: 'Description cannot exceed 500 characters',
    }).nullable().optional(),
    address: zod_1.z.string({
        invalid_type_error: 'Address must be a string',
    }).min(10, {
        message: 'Address must be at least 10 characters',
    }).max(200, {
        message: 'Address cannot exceed 200 characters',
    }).nullable().optional(),
    chairperson: zod_1.z.string({
        invalid_type_error: 'Chairperson name must be a string',
    }).min(3, {
        message: 'Chairperson name must be at least 3 characters',
    }).max(100, {
        message: 'Chairperson name cannot exceed 100 characters',
    }).nullable().optional(),
    phoneNumber: zod_1.z.string({
        invalid_type_error: 'Phone number must be a string',
    }).regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
        message: 'Please enter a valid Indonesian phone number',
    }).nullable().optional(),
    email: zod_1.z.string({
        invalid_type_error: 'Email must be a string',
    }).email({
        message: 'Please enter a valid email address',
    }).nullable().optional(),
    isActive: zod_1.z.boolean({
        invalid_type_error: 'isActive must be a boolean',
    }).optional(),
}).refine((data) => {
    // Ensure at least one field is provided for update
    const keys = Object.keys(data);
    return keys.length > 0 && keys.some(key => data[key] !== undefined);
}, {
    message: 'At least one field must be provided for update',
});
