import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('models')
export class Model {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column()
  provider: string;

  @Column({ nullable: true, type: 'text' })
  baseURL?: string;

  @Column({ nullable: true, type: 'text' })
  encryptedApiKey?: string;

  @Column({ nullable: true })
  apiKeyEnv?: string;

  @Column({ nullable: true })
  maxTokens?: number;

  @Column({ nullable: true })
  temperature?: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
