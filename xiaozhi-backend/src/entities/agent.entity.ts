import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinTable, ManyToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Plugin } from './plugin.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.agents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ name: 'model_id', length: 100 })
  modelId: string;

  @Column({ type: 'text', nullable: true })
  prompt: string;

  @Column({ type: 'json' })
  settings: Record<string, any>;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToMany(() => Plugin)
  @JoinTable({
    name: 'agent_plugins',
    joinColumn: { name: 'agent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'plugin_id', referencedColumnName: 'id' },
  })
  plugins: Plugin[];
}
