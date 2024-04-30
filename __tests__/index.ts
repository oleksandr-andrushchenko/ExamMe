import app from '../src/app'
import { afterAll, beforeAll, beforeEach } from '@jest/globals'
import Category from '../src/entity/Category'
import User from '../src/entity/User'
import { faker } from '@faker-js/faker'
import { ConnectionManager } from 'typeorm'
import { Container } from 'typedi'
import AuthService from '../src/service/auth/AuthService'
import TokenSchema from '../src/schema/auth/TokenSchema'
import CategoryRepository from '../src/repository/CategoryRepository'
import UserRepository from '../src/repository/UserRepository'
import Permission from '../src/enum/Permission'
import { ObjectId } from 'mongodb'
import QuestionRepository from '../src/repository/QuestionRepository'
import Question, { QuestionAnswer, QuestionChoice, QuestionDifficulty, QuestionType } from '../src/entity/Question'
import Exam, { ExamQuestion } from '../src/entity/Exam'
import ExamRepository from '../src/repository/ExamRepository'

const api = app().api()

const clear = async () => {
  await Container.get<UserRepository>(UserRepository).clear()
  await Container.get<CategoryRepository>(CategoryRepository).clear()
  await Container.get<QuestionRepository>(QuestionRepository).clear()
  await Container.get<ExamRepository>(ExamRepository).clear()
}

beforeAll(() => api.up())
beforeEach(() => clear())
afterAll(() => api.down())

export const server = api.app

export const fixture = async <Entity>(entity: any, options: object = {}): Promise<Entity> => {
  let object: any

  switch (entity) {
    case User:
      object = (new User())
        .setName(faker.person.fullName())
        .setEmail(faker.internet.email())
        .setPassword(options['password'] ?? faker.internet.password())
        .setPermissions(options['permissions'] ?? [ Permission.REGULAR ])

      break
    case Category:
      object = (new Category())
        .setName(faker.lorem.word())
        .setCreator(options['creator'] ?? (await fixture(User, options) as User).getId())

      object.setOwner(options['owner'] ?? object.getCreator())

      break
    case Question:
      object = (new Question())
        .setCategory(options['category'] ?? (await fixture(Category, options) as Category).getId())
        .setType(faker.helpers.enumValue(QuestionType))
        .setDifficulty(faker.helpers.enumValue(QuestionDifficulty))
        .setTitle(faker.lorem.sentences(3))
        .setCreator(options['creator'] ?? (await fixture(User, options) as User).getId())

      object.setOwner(options['owner'] ?? object.getCreator())

      if (object.getType() === QuestionType.TYPE) {
        const answers = []

        for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
          answers.push(
            (new QuestionAnswer())
              .setVariants([ faker.lorem.word() ])
              .setIsCorrect(faker.datatype.boolean())
              .setExplanation(faker.datatype.boolean() ? faker.lorem.sentence() : undefined),
          )
        }

        object.setAnswers(answers)
      } else if (object.getType() === QuestionType.CHOICE) {
        const choices = []

        for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
          choices.push(
            (new QuestionChoice())
              .setTitle(faker.lorem.word())
              .setIsCorrect(faker.datatype.boolean())
              .setExplanation(faker.datatype.boolean() ? faker.lorem.sentence() : undefined),
          )
        }

        object.setChoices(choices)
      }

      break
    case Exam:
      object = (new Exam())
        .setCategory(options['category'] ?? (await fixture(Category, options) as Category).getId())
        .setCreator(options['creator'] ?? (await fixture(User, options) as User).getId())

      object.setOwner(options['owner'] ?? object.getCreator())

      const questions = []

      for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
        const question = await fixture(Question, { ...options, ...{ category: object.getCategory() } }) as Question
        const examQuestion = (new ExamQuestion())
          .setQuestion(question.getId())

        if (faker.datatype.boolean()) {
          if (question.getType() === QuestionType.CHOICE) {
            examQuestion.setChoice(faker.number.int({ min: 0, max: question.getChoices().length - 1 }))
          } else if (question.getType() === QuestionType.TYPE) {
            const variants = question.getAnswers()[faker.number.int({ min: 0, max: question.getAnswers().length - 1 })]
              .getVariants()
            examQuestion.setAnswer(variants[faker.number.int({ min: 0, max: variants.length - 1 })])
          }
        }

        questions.push(examQuestion)
      }

      object.setQuestions(questions)
        .setQuestionNumber(faker.number.int({ min: 0, max: questions.length - 1 }))

      break
    default:
      throw new Error(`Unknown "${ entity.toString() }" type passed`)
  }

  await Container.get<ConnectionManager>(ConnectionManager).get('default').manager.save(object)

  return object
}

export const load = async <Entity>(entity: any, id: ObjectId): Promise<Entity> => {
  switch (entity) {
    case User:
      return await Container.get<UserRepository>(UserRepository).findOneById(id) as any
    case Category:
      return await Container.get<CategoryRepository>(CategoryRepository).findOneById(id) as any
    case Question:
      return await Container.get<QuestionRepository>(QuestionRepository).findOneById(id) as any
    case Exam:
      return await Container.get<ExamRepository>(ExamRepository).findOneById(id) as any
    default:
      throw new Error(`Unknown "${ entity.toString() }" type passed`)
  }
}

export const error = (name: string = '', message: string = '', errors: string[] = []) => {
  const body = {}

  if (name) {
    body['name'] = name
  }

  if (message) {
    body['message'] = message
  }

  if (errors.length > 0) {
    body['errors'] = errors
  }

  return body
}

export const graphqlError = (name: string) => {
  return { errors: [ { extensions: { name } } ] }
}

export const auth = async (user: User): Promise<TokenSchema> => {
  const authService: AuthService = Container.get<AuthService>(AuthService)

  return await authService.createAuth(user)
}

export const fakeId = async (): Promise<ObjectId> => ObjectId.createFromTime(Date.now())