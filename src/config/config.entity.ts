import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'public', name: 'config' })
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column()
  value: string;
}
