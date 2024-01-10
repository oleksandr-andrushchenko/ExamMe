import { Application as express } from "express";
import { useExpressServer } from "routing-controllers";
import IndexController from "../controllers/IndexController";
import CompressionMiddleware from "../middlewares/CompressionMiddleware";
import LogMiddleware from "../middlewares/LogMiddleware";

export const expressLoader = (app: express): void => {
    useExpressServer(app, {
        controllers: [IndexController],
        middlewares: [CompressionMiddleware, LogMiddleware],
    });
};

