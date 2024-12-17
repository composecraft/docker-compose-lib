export class IllegalArgumentException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "IllegalArgumentException";

        // Maintaining proper stack trace (only available on V8 engines)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IllegalArgumentException);
        }
    }
}
