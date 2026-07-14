import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private readonly config: Record<string, any>;

  constructor() {
    const configPath = path.resolve(process.cwd(), 'config.yaml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    this.config = yaml.load(configFile) as Record<string, any>;
  }

  get<T = any>(key: string): T {
    const keys = key.split('.');
    let result: any = this.config;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return undefined as T;
      }
    }
    
    return result as T;
  }

  getAll() {
    return this.config;
  }
}
