// --- entities/list_suggestions.entity.ts ---
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
import { ListItem } from './list_items.entity'

@Entity('list_suggestions')
export class ListSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => List, (list) => list.suggestions)
  list: List

  @ManyToOne(() => ListItem, { nullable: true })
  source_item: ListItem

  @Column()
  label: string

  @Column({ nullable: true })
  category: string

  @Column({ nullable: true })
  reason: string

  @Column('float', { nullable: true })
  confidence: number

  @Column({ nullable: true })
  accepted: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date
}
