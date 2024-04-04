import { ObjectId } from 'mongodb'

export default class ExamNotFoundError extends Error {

  constructor(id: ObjectId) {
    super(`Exam with id="${ id.toString() }" not found error`)
  }
}