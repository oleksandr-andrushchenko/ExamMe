import { MongoRepository } from 'typeorm'
import Repository from '../decorator/Repository'
import { ObjectId } from 'mongodb'
import Exam from '../entity/Exam'

@Repository(Exam)
export default class ExamRepository extends MongoRepository<Exam> {

  public async findOneById(id: ObjectId): Promise<Exam | null> {
    return await this.findOneBy({ _id: id })
  }

  public async findOneNotCompletedByCategoryAndCreator(categoryId: ObjectId, userId: ObjectId): Promise<Exam | null> {
    return await this.findOneBy({
      category: categoryId,
      creator: userId,
      completed: { $exists: false },
    })
  }
}