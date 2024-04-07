import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

export class ExamQuestion {

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private question: ObjectId

  @IsOptional()
  @IsNumber()
  @Column()
  public choice: number

  @IsOptional()
  @IsString()
  @Column()
  public answer: string

  public setQuestion(question: ObjectId): this {
    this.question = question

    return this
  }

  public getQuestion(): ObjectId {
    return this.question
  }

  public setChoice(choice: number | undefined): this {
    this.choice = choice

    return this
  }

  public getChoice(): number {
    return this.choice
  }

  public setAnswer(answer: string | undefined): this {
    this.answer = answer

    return this
  }

  public getAnswer(): string {
    return this.answer
  }
}

@Entity({ name: 'exams' })
export default class Exam {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private id: ObjectId

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private category: ObjectId

  @Exclude()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestion)
  @Column(() => ExamQuestion)
  private questions: ExamQuestion[]

  @IsNumber()
  @Min(0)
  @Column({ default: 0, nullable: false })
  private lastRequestedQuestionNumber: number = 0

  @IsOptional()
  @IsDate()
  @Column()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private completed: Date

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private creator: ObjectId

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private owner: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private deleted: Date

  public getId(): ObjectId {
    return this.id
  }

  public setCategory(category: ObjectId): this {
    this.category = category

    return this
  }

  public setQuestions(questions: ExamQuestion[]): this {
    this.questions = questions

    return this
  }

  public getQuestions(): ExamQuestion[] {
    return this.questions
  }

  @Expose({ name: 'questionCount' })
  public getQuestionCount(): number {
    return this.questions.length
  }

  public getCategory(): ObjectId {
    return this.category
  }

  public setLastRequestedQuestionNumber(lastRequestedQuestionNumber: number): this {
    this.lastRequestedQuestionNumber = lastRequestedQuestionNumber

    return this
  }

  public getLastRequestedQuestionNumber(): number {
    return this.lastRequestedQuestionNumber
  }

  public setCreator(creator: ObjectId): this {
    this.creator = creator

    return this
  }

  public getCreator(): ObjectId {
    return this.creator
  }

  public setOwner(owner: ObjectId): this {
    this.owner = owner

    return this
  }

  public getOwner(): ObjectId {
    return this.owner
  }
}
