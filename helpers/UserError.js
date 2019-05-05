class UserError extends Error {
    constructor(message, details) {
        super(message);
        this.name = "UserError";
        this.details = details;
        Object.setPrototypeOf(this, UserError.prototype);
    }
}

export { UserError };