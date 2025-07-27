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
            // Check if test user already exists
            const existingUser = yield prisma.user.findUnique({
                where: { email: 'admin@example.com' },
            });
            if (existingUser) {
                console.log('Test user already exists');
                return;
            }
            // Hash password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash('password123', salt);
            // Create admin user
            const adminUser = yield prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    password: hashedPassword,
                    name: 'Admin User',
                    role: 'ADMIN',
                },
            });
            console.log('Admin user created:', adminUser);
            // Create RT user
            const rtUser = yield prisma.user.create({
                data: {
                    email: 'rt@example.com',
                    password: hashedPassword,
                    name: 'RT User',
                    role: 'RT',
                },
            });
            console.log('RT user created:', rtUser);
            // Create RW user
            const rwUser = yield prisma.user.create({
                data: {
                    email: 'rw@example.com',
                    password: hashedPassword,
                    name: 'RW User',
                    role: 'RW',
                },
            });
            console.log('RW user created:', rwUser);
            // Create regular user
            const regularUser = yield prisma.user.create({
                data: {
                    email: 'user@example.com',
                    password: hashedPassword,
                    name: 'Regular User',
                    role: 'WARGA',
                },
            });
            console.log('Regular user created:', regularUser);
            console.log('Test users created successfully');
        }
        catch (error) {
            console.error('Error creating test users:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
