"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAgentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_agent_dto_1 = require("./create-agent.dto");
class UpdateAgentDto extends (0, swagger_1.PartialType)(create_agent_dto_1.CreateAgentDto) {
}
exports.UpdateAgentDto = UpdateAgentDto;
//# sourceMappingURL=update-agent.dto.js.map