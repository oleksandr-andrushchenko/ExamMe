import { Column, Entity } from 'typeorm'
import { IsNumber, Length, Max, Min } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'
import Base from '../Base'
import Rating from '../rating/Rating'

@ObjectType()
@Entity({ name: 'categories' })
export default class Category extends Base {

  @Length(3, 100)
  @Column({ unique: true })
  @Field()
  public name: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int, { nullable: true })
  public questionCount?: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int, { nullable: true })
  public approvedQuestionCount?: number = 0

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int, { nullable: true })
  public requiredScore?: number = 0

  @Column(() => Rating)
  public rating?: Rating

  @Field(_type => Boolean, { name: 'isApproved', nullable: true })
  public getIsApproved(): boolean {
    return !this.ownerId
  }
}