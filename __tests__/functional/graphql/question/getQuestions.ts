import GetQuestions from '../../../../src/schema/question/GetQuestions'

export const getQuestions = (variables: GetQuestions = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetQuestions($category: ID, $difficulty: String, $type: String, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
        questions(category: $category, difficulty: $difficulty, type: $type, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}