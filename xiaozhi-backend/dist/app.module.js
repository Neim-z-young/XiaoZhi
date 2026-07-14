"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_module_1 = require("./config/config.module");
const configuration_1 = require("./config/configuration");
const agents_module_1 = require("./modules/agents/agents.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const chat_module_1 = require("./modules/chat/chat.module");
const plugins_module_1 = require("./modules/plugins/plugins.module");
const knowledge_module_1 = require("./modules/knowledge/knowledge.module");
const memory_module_1 = require("./modules/memory/memory.module");
const system_module_1 = require("./modules/system/system.module");
const auth_module_1 = require("./modules/auth/auth.module");
const workspaces_module_1 = require("./modules/workspaces/workspaces.module");
const ai_module_1 = require("./modules/ai/ai.module");
const models_module_1 = require("./modules/models/models.module");
const user_entity_1 = require("./entities/user.entity");
const agent_entity_1 = require("./entities/agent.entity");
const plugin_entity_1 = require("./entities/plugin.entity");
const session_entity_1 = require("./entities/session.entity");
const message_entity_1 = require("./entities/message.entity");
const workspace_entity_1 = require("./entities/workspace.entity");
const knowledge_base_entity_1 = require("./entities/knowledge-base.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_module_1.ConfigModule],
                useFactory: (configService) => {
                    const dbType = configService.get('database.type') || 'sqlite';
                    if (dbType === 'sqlite') {
                        return {
                            type: 'sqljs',
                            location: 'xiaozhi',
                            autoSave: true,
                            entities: [user_entity_1.User, agent_entity_1.Agent, plugin_entity_1.Plugin, session_entity_1.Session, message_entity_1.Message, workspace_entity_1.Workspace, knowledge_base_entity_1.KnowledgeBase],
                            synchronize: true,
                            logging: false,
                        };
                    }
                    return {
                        type: 'postgres',
                        host: configService.get('database.host'),
                        port: configService.get('database.port'),
                        username: configService.get('database.username'),
                        password: configService.get('database.password'),
                        database: configService.get('database.database'),
                        entities: [user_entity_1.User, agent_entity_1.Agent, plugin_entity_1.Plugin, session_entity_1.Session, message_entity_1.Message, workspace_entity_1.Workspace, knowledge_base_entity_1.KnowledgeBase],
                        synchronize: true,
                        logging: false,
                    };
                },
                inject: [configuration_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            agents_module_1.AgentsModule,
            sessions_module_1.SessionsModule,
            chat_module_1.ChatModule,
            plugins_module_1.PluginsModule,
            knowledge_module_1.KnowledgeModule,
            memory_module_1.MemoryModule,
            system_module_1.SystemModule,
            workspaces_module_1.WorkspacesModule,
            ai_module_1.AIModule,
            models_module_1.ModelsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map