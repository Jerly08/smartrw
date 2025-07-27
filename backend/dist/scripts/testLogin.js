"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:4000/api';
function testLogin(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            console.log(`Testing login for ${email}...`);
            const response = yield axios_1.default.post(`${API_URL}/auth/login`, {
                email,
                password
            });
            console.log(`Login successful for ${email}`);
            console.log(`User role: ${response.data.data.user.role}`);
            console.log('Token received:', response.data.data.token.substring(0, 20) + '...');
            console.log('-----------------------------------');
            return true;
        }
        catch (error) {
            console.error(`Login failed for ${email}:`, ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error.message);
            console.log('-----------------------------------');
            return false;
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing logins for all seeded accounts...');
        console.log('-----------------------------------');
        const accounts = [
            { email: 'admin@example.com', password: 'password123' },
            { email: 'rt@example.com', password: 'password123' },
            { email: 'rw@example.com', password: 'password123' },
            { email: 'warga@example.com', password: 'password123' }
        ];
        let successCount = 0;
        for (const account of accounts) {
            const success = yield testLogin(account.email, account.password);
            if (success)
                successCount++;
        }
        console.log(`Login test completed: ${successCount}/${accounts.length} successful logins`);
    });
}
main().catch(console.error);
