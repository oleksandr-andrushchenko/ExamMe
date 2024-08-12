import Category from '../../../../src/entities/category/Category'
import RateCategoryRequest from '../../../../src/schema/category/RateCategoryRequest'

export const rateCategory = (variables: RateCategoryRequest, fields: (keyof Category)[] = [ 'id' ]) => {
  return {
    query: `
      mutation RateCategory($categoryId: ID!, $mark: Int!) {
        rateCategory(categoryId: $categoryId, mark: $mark) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}