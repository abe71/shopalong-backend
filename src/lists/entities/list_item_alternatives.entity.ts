// --- entities/list_item_alternatives.entity.ts ---
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { ListItem } from './list_items.entity'

@Entity('list_item_alternatives')
export class ListItemAlternative {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => ListItem, (item) => item.alternatives)
  item: ListItem

  @Column()
  label: string

  @Column({ nullable: true })
  reason: string

  @Column('float', { nullable: true })
  confidence: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date
}
