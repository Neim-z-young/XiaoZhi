import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('long_term_memory')
export class LongTermMemory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'agent_id' })
  agentId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'memory_type', length: 50, default: 'conversation' })
  memoryType: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
