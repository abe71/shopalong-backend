// --- entities/lists.entity.ts ---
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm'
import { ListItem } from './list_items.entity'
import { ListSuggestion } from './list_suggestions.entity'
import { ListStatusEvent } from './list_status_events.entity'
import { User } from '@/users/entities/users.entity'

@Unique(['origin_list_guid', 'version'])
@Entity('lists')
export class List {
  @PrimaryColumn({ type: 'uuid' })
  list_guid: string

  @Column({ type: 'uuid' })
  origin_list_guid: string

  @Column({ type: 'int' })
  version: number

  @Column({ type: 'varchar', nullable: true })
  name?: string

  @Column({ type: 'varchar', nullable: true })
  store_id?: string

  @ManyToOne(() => User, (user) => user.lists, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User

  @OneToMany(() => ListItem, (item) => item.list)
  items: ListItem[]

  @OneToMany(() => ListSuggestion, (suggestion) => suggestion.list)
  suggestions: ListSuggestion[]

  @OneToMany(() => ListStatusEvent, (event) => event.list)
  statusEvents: ListStatusEvent[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date
}
