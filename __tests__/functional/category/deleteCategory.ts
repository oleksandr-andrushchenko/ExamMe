import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import User from '../../../src/entities/User'
import CategoryPermission from '../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { removeCategoryMutation } from '../../graphql/category/removeCategoryMutation'

describe('Delete category', () => {
  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).delete(`/categories/${ category.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await auth(user)).token
    const res = await request(app).delete('/categories/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/categories/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const res = await request(app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const category = await fixture<Category>(Category)
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const now = Date.now()
    const res = await request(app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestCategory = await load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await auth(user)).token
    const now = Date.now()
    const res = await request(app).delete(`/categories/${ category.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestCategory = await load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const category = await fixture<Category>(Category, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership) (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const user = await load<User>(User, category.creator)
    const token = (await auth(user)).token
    const now = Date.now()
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeCategory: true } })
    const latestCategory = await load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission) (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ CategoryPermission.DELETE ] })
    const token = (await auth(user)).token
    const now = Date.now()
    const res = await request(app).post('/graphql')
      .send(removeCategoryMutation({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeCategory: true } })
    const latestCategory = await load<Category>(Category, category.id)
    expect(latestCategory).not.toBeNull()
    expect(latestCategory.deleted.getTime()).toBeGreaterThanOrEqual(now)
  })
})