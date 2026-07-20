import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('mcp_servers')
export class McpServer {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  command: string;

  @Column('simple-json')
  args: string[];

  @Column({ type: 'simple-json', nullable: true })
  env?: Record<string, string>;

  @Column({ nullable: true })
  cwd?: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
