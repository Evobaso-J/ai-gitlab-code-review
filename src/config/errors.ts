import type { FastifyError } from "fastify";

export class BaseError<T extends string> extends Error {
    override name: T;
    override message: string;
    override cause: any;
    statusCode: FastifyError['statusCode'];

    constructor({
        name,
        message,
        cause,
        statusCode = 500,
    }: {
        name: T;
        message: string;
        cause?: any;
        statusCode?: FastifyError['statusCode'];
    }) {
        super();
        this.name = name;
        this.message = message;
        this.cause = cause;
        this.statusCode = statusCode;
    }
}