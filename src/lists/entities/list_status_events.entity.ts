// --- entities/list_status_events.entity.ts ---
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { List } from './lists.entity'

@Entity('list_status_events')
export class ListStatusEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => List, (list) => list.statusEvents)
  list: List

  @Column()
  event_type: string

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  details: Record<string, any>

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date
}
