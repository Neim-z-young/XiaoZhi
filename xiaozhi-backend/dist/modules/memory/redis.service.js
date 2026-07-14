"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../../config/configuration");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.isConnected = false;
        console.log('Redis service initialized (mock)');
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }
    async get(key) {
        console.log(`Redis GET: ${key}`);
        return null;
    }
    async set(key, value, ttl) {
        console.log(`Redis SET: ${key} = ${value} (ttl: ${ttl})`);
    }
    async del(key) {
        console.log(`Redis DEL: ${key}`);
    }
    async lpush(key, value) {
        console.log(`Redis LPUSH: ${key} ${value}`);
    }
    async lrange(key, start, stop) {
        console.log(`Redis LRANGE: ${key} ${start} ${stop}`);
        return [];
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map