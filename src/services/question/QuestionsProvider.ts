import { Inject, Service } from 'typedi'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/Question'
import QuestionRepository from '../../repositories/QuestionRepository'
import Cursor from '../../models/Cursor'
import GetQuestions from '../../schema/question/GetQuestions'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'

@Service()
export default class QuestionsProvider {

  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getQuestions(
    getQuestions: GetQuestions,
    meta: boolean = false,
  ): Promise<Question[] | PaginatedQuestions> {
    await this.validator.validate(getQuestions)

    const cursor = new Cursor<Question>(getQuestions, this.questionRepository)

    const where = {}

    if ('category' in getQuestions) {
      where['categoryId'] = new ObjectId(getQuestions.category)
    }

    if ('subscription' in getQuestions) {
      where['subscription'] = { $exists: getQuestions.subscription === 'yes' }
    }

    if ('approved' in getQuestions) {
      where['ownerId'] = { $exists: getQuestions.approved !== 'yes' }
    }

    if ('search' in getQuestions) {
      where['title'] = { $regex: getQuestions.search, $options: 'i' }
    }

    if ('difficulty' in getQuestions) {
      where['difficulty'] = getQuestions.difficulty
    }

    if ('type' in getQuestions) {
      where['type'] = getQuestions.type
    }

    return await cursor.getPaginated({ where, meta })
  }
}