export class BaseError<T extends string> extends Error {
    override name: T;
    override message: string;
    override cause: any;

    constructor({
        name,
        message,
        cause,
    }: {
        name: T;
        message: string;
        cause?: any;
    }) {
        super();
        this.name = name;
        this.message = message;
        this.cause = cause;
    }
}