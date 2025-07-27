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
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = 'admin@example.com';
            const password = 'password123';
            // Find user by email
            const user = yield prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                console.log('User not found');
                return;
            }
            console.log('User found:', {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                passwordHash: user.password.substring(0, 20) + '...',
            });
            // Check password
            const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
            console.log('Password valid:', isPasswordValid);
            // Create a new hash for the same password to see if it matches
            const salt = yield bcryptjs_1.default.genSalt(10);
            const newHash = yield bcryptjs_1.default.hash(password, salt);
            console.log('New hash:', newHash);
            // Update the user's password with a new hash
            if (!isPasswordValid) {
                console.log('Updating password...');
                yield prisma.user.update({
                    where: { id: user.id },
                    data: { password: newHash },
                });
                console.log('Password updated successfully');
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
