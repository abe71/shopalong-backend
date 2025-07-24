// --- entities/list_items.entity.ts ---
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { List } from './lists.entity'
import { ListItemAlternative } from './list_item_alternatives.entity'

@Entity('list_items')
export class ListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => List, (list) => list.items)
  list: List

  @Column()
  ordinal: number

  @Column()
  name: string

  @Column()
  category: string

  @Column('float', { default: 1.0 })
  confidence: number

  @OneToMany(() => ListItemAlternative, (alt) => alt.item)
  alternatives: ListItemAlternative[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date | null
}
