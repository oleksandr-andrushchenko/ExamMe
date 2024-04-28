import { IsNumber, Length, Max, Min } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
export default class CategorySchema {

  @Length(3, 100)
  @Field()
  public readonly name: string

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { defaultValue: 0 })
  public readonly requiredScore: number = 0
}