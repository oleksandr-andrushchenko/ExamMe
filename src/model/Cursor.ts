import PaginationSchema from '../schema/pagination/PaginationSchema'
import { ObjectId } from 'mongodb'
import { MongoRepository } from 'typeorm'
import PaginatedSchema, { PaginatedMetaSchema } from '../schema/pagination/PaginatedSchema'

/**
 * @see https://engage.so/blog/a-deep-dive-into-offset-and-cursor-based-pagination-in-mongodb/#challenges-of-cursor-based-pagination
 */
export default class Cursor<Entity> {

  constructor(
    private readonly pagination: PaginationSchema,
    private repository: MongoRepository<Entity> = undefined,
  ) {
  }

  public setRepository(repository: MongoRepository<Entity>): void {
    this.repository = repository
  }

  public async getPaginated(): Promise<PaginatedSchema<Entity>> {
    const paginated = new PaginatedSchema<Entity>()
    paginated.meta = new PaginatedMetaSchema()
    paginated.meta.cursor = this.pagination.cursor
    paginated.meta.order = this.pagination.order

    const where = {}

    const order = {
      query: this.pagination.order,
      key: '',
      direction: -1,
    }

    let cursor: string

    if (this.pagination.prevCursor) {
      cursor = this.pagination.prevCursor

      if (order.query === 'desc') {
        order.key = '$gt'
        order.direction = 1
      } else {
        order.key = '$lt'
        order.direction = -1
      }
    } else if (this.pagination.nextCursor) {
      cursor = this.pagination.nextCursor

      if (order.query === 'desc') {
        order.key = '$lt'
        order.direction = -1
      } else {
        order.key = '$gt'
        order.direction = 1
      }
    } else {
      if (order.query === 'desc') {
        order.direction = -1
      } else {
        order.direction = 1
      }
    }

    const sort = {}

    let cursorParam: string | number | Date

    if (cursor) {
      let [ id, param ] = cursor.split('_')

      const cursorId = new ObjectId(id)

      if (param) {
        if ([ 'created', 'updated' ].includes(param)) {
          cursorParam = new Date(param)
        }

        where['$or'] = [
          { [this.pagination.cursor]: { [order.key]: cursorParam } },
          {
            [this.pagination.cursor]: cursorParam,
            _id: { [order.key]: cursorId },
          },
        ]
        sort[this.pagination.cursor] = order.direction
      } else {
        where['_id'] = { [order.key]: cursorId }
      }
    }

    sort['_id'] = order.direction

    const data = await this.repository.find({ where, take: this.pagination.size, order: sort })
    paginated.data = data

    if (this.pagination.prevCursor) {
      data.reverse()
    }

    let hasNext: boolean, hasPrev: boolean

    if (data.length) {
      order.key = (order.query === 'desc') ? '$lt' : '$gt'
      cursorParam = data[data.length - 1][this.pagination.cursor === '_id' ? 'id' : this.pagination.cursor]

      if (this.pagination.cursor === '_id') {
        where['_id'] = { [order.key]: new ObjectId(cursorParam as string) }
      } else {
        if ([ 'created', 'updated' ].includes(this.pagination.cursor)) {
          cursorParam = new Date(cursorParam)
        }

        where['$or'] = [
          { [this.pagination.cursor]: { [order.key]: cursorParam } },
          {
            [this.pagination.cursor]: cursorParam,
            _id: { [order.key]: new ObjectId(data[data.length - 1]['id']) },
          },
        ]
      }

      hasNext = !!await this.repository.findOne({ where })

      order.key = (order.query === 'desc') ? '$gt' : '$lt'
      cursorParam = data[0][this.pagination.cursor === '_id' ? 'id' : this.pagination.cursor]

      if (this.pagination.cursor === '_id') {
        where['_id'] = { [order.key]: new ObjectId(cursorParam as string) }
      } else {
        if ([ 'created', 'updated' ].includes(this.pagination.cursor)) {
          cursorParam = new Date(cursorParam)
        }

        where['$or'] = [
          { [this.pagination.cursor]: { [order.key]: cursorParam } },
          {
            [this.pagination.cursor]: cursorParam,
            _id: { [order.key]: new ObjectId(data[0]['id']) },
          },
        ]
      }

      hasPrev = !!await this.repository.findOne({ where })
    }

    paginated.meta.order = order.query
    paginated.meta.hasNext = hasNext
    paginated.meta.hasPrev = hasPrev

    if (hasNext) {
      paginated.meta.nextCursor = data[data.length - 1]['id']

      if (this.pagination.cursor !== '_id') {
        paginated.meta.nextCursor += '_' + data[data.length - 1][this.pagination.cursor]
      }
    }

    if (hasPrev) {
      paginated.meta.prevCursor = data[0]['id']

      if (this.pagination.cursor !== '_id') {
        paginated.meta.prevCursor += '_' + data[0][this.pagination.cursor]
      }
    }

    return paginated
  }
}