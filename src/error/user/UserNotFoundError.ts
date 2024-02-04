export default class UserNotFoundError extends Error {

    constructor(id: string) {
        super(`User with id="${id}" not found error`);
    }
}