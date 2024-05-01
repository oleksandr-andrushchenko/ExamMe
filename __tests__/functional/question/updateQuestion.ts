import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Question from '../../../src/entities/Question'
import User from '../../../src/entities/User'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../src/enums/question/QuestionPermission'

describe('PATCH /questions/:questionId', () => {
  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const id = question.id
    const res = await request(app).patch(`/questions/${ id.toString() }`).send({ title: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).patch(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).patch(`/questions/${ id.toString() }`).send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const question = await fixture<Question>(Question)
    const id = question.id
    const res = await request(app).patch(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const id = question.id
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const id = question.id
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const question1 = await fixture<Question>(Question)
    const question = await fixture<Question>(Question, { permissions: [ QuestionPermission.UPDATE ] })
    const id = question.id
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/questions/${ id.toString() }`).send({ title: question1.title }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    const question = await fixture<Question>(Question)
    const id = question.id
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, id)).toMatchObject(schema)
  })
  test('Updated (has permission)', async () => {
    const question = await fixture<Question>(Question)
    const id = question.id
    const permissions = [
      QuestionPermission.UPDATE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ id.toString() }`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, id)).toMatchObject(schema)
  })
})