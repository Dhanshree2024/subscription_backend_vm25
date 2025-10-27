import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mail_config', { schema: 'public' })
export class MailConfig {
  @PrimaryGeneratedColumn({ name: 'mail_config_id' })
  id: number;

  @Column({ name: 'smtp_host' })
  smtpHost: string;

  @Column({ name: 'smtp_port', type: 'int' })
  smtpPort: number;

  @Column({ name: 'smtp_username' })
  smtpUsername: string;

  @Column({ name: 'smtp_password' })
  smtpPassword: string; // Store encrypted in DB

  @Column({ name: 'smtp_from_email' })
  smtpFromEmail: string;

  @Column({ name: 'smtp_from_name', nullable: true })
  smtpFromName?: string;

  @Column({ name: 'smtp_reply_email', nullable: true })
  smtpReplyMail?: string;

  @Column({ name: 'use_tls', type: 'boolean', default: true })
  useTLS: boolean;

  @Column({ name: 'use_ssl', type: 'boolean', default: false })
  useSSL: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_active', type: 'int', default: 1 })
  isActive: number;
}
