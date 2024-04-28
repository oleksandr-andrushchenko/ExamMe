import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, load, server as app } from '../../index'
import User from '../../../src/entity/User'

describe('DELETE /me', () => {
  test('Unauthorized', async () => {
    const res = await request(app).delete(`/me`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Deleted', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/me`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<User>(User, user.getId())).toBeNull()
  })
})