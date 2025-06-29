import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class Ping {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  message: string
}
