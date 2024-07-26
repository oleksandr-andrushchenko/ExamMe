import { Inject, Service } from 'typedi'
import Category from '../../entities/Category'
import User from '../../entities/User'
import ExamRepository from '../../repositories/ExamRepository'
import ExamTakenError from '../../errors/exam/ExamTakenError'

@Service()
export default class ExamVerifier {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
  ) {
  }

  /**
   * @param {Category} category
   * @param {User} user
   * @returns {Promise<void>}
   * @throws {ExamTakenError}
   */
  public async verifyExamNotTaken(category: Category, user: User): Promise<void> {
    const existing = await this.examRepository.findOneNotCompletedByCategoryAndOwner(category.id, user)

    if (existing) {
      throw new ExamTakenError(existing)
    }
  }
}