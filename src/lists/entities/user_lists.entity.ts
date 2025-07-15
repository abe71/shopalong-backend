// --- entities/user_lists.entity.ts ---
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/users.entity'
import { List } from './lists.entity'

@Entity('user_lists')
export class UserList {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User)
  user: User

  @ManyToOne(() => List)
  list: List

  @Column({ default: 'owner' })
  role: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @DeleteDateColumn()
  deleted_at: Date
}
