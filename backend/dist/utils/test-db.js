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
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Test connection
            console.log('Testing database connection...');
            // Create a test user
            const user = yield prisma.user.create({
                data: {
                    email: 'admin@smartrw.com',
                    password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Ku', // "secret"
                    name: 'Admin User',
                    role: 'ADMIN',
                },
            });
            console.log('Created test user:');
            console.log(user);
            // Count models
            const userCount = yield prisma.user.count();
            console.log(`Database has ${userCount} users`);
            console.log('Database connection and schema test successful!');
        }
        catch (error) {
            console.error('Error testing database:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
