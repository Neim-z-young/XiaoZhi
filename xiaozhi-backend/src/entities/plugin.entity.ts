import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Agent } from './agent.entity';

@Entity('plugins')
export class Plugin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 20 })
  type: 'mcp' | 'a2a' | 'builtin';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  config: Record<string, any>;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'installed_at' })
  installedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Agent, (agent) => agent.plugins)
  agents: Agent[];
}
