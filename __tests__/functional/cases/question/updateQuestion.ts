import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/Question'
import User from '../../../../src/entities/User'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { updateQuestionMutation } from '../../graphql/question/updateQuestionMutation'
import QuestionUpdateSchema from '../../../../src/schema/question/QuestionUpdateSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Update question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({ questionId: question.id.toString(), questionUpdate: { title: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({ questionId: 'invalid', questionUpdate: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({ questionId: id.toString(), questionUpdate: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: undefined as QuestionUpdateSchema,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: faker.lorem.sentences(3) },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: faker.lorem.sentences(3) },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const question1 = await framework.fixture<Question>(Question)
    const question = await framework.fixture<Question>(Question, { permissions: [ QuestionPermission.UPDATE ] })
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: question1.title },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const questionUpdate = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({ questionId, questionUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })
    expect(await framework.load<Question>(Question, question.id)).toMatchObject(questionUpdate)
  })
  test('Updated (has permission)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const questionUpdate = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).post('/')
      .send(updateQuestionMutation({ questionId, questionUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })
    expect(await framework.load<Question>(Question, question.id)).toMatchObject(questionUpdate)
  })
})