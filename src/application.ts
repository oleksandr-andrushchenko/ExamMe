import 'reflect-metadata';
import { DataSource, useContainer as typeormUseContainer, ConnectionManager } from 'typeorm';
import { Container } from "typedi";
import config from "./config";
import { WinstonLoggerFactory } from "./logger/WinstonLoggerFactory";
import {
    useContainer as routingControllerUseContainer,
    useExpressServer,
    getMetadataArgsStorage,
} from "routing-controllers";
import express, { Application } from "express";
import LoggerInterface from "./logger/LoggerInterface";
import JwtTokenStrategyFactory from "./service/token/strategy/JwtTokenStrategyFactory";
import AuthService from "./service/auth/AuthService";
import TokenStrategyInterface from "./service/token/strategy/TokenStrategyInterface";
import { ValidatorOptions } from "class-validator/types/validation/ValidatorOptions";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { MongoDriver } from "typeorm/driver/mongodb/MongoDriver";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";
import * as swaggerUiExpress from "swagger-ui-express";
import { routingControllersToSpec } from "routing-controllers-openapi";
import { RoutingControllersOptions } from "routing-controllers/types/RoutingControllersOptions";
import basicAuth from 'express-basic-auth';

export default async (): Promise<{
    app: Application,
    dataSource: DataSource,
    port: number,
    logger: LoggerInterface,
}> => {
    typeormUseContainer(Container);
    routingControllerUseContainer(Container);

    Container.set('env', config.env);
    Container.set('loggerFormat', config.logger.format);

    const logger: LoggerInterface = Container.get<WinstonLoggerFactory>(WinstonLoggerFactory).create(config.logger);
    Container.set('logger', logger);

    const projectDir = config.project_dir;
    const mongoLogging = config.db.type === 'mongodb' && config.db.logging;

    const connectionManager = new ConnectionManager();
    Container.set({ id: ConnectionManager, value: connectionManager });

    const dataSourceOptions: MongoConnectionOptions = {
        type: config.db.type,
        url: config.db.url,
        synchronize: config.db.synchronize,
        logging: config.db.logging,
        entities: [`${projectDir}/src/entity/*.ts`],
        subscribers: [`${projectDir}/src/subscriber/*.ts`],
        monitorCommands: mongoLogging,
    };

    const dataSource = await connectionManager.create(dataSourceOptions).initialize();

    if (mongoLogging) {
        const conn = (dataSource.driver as MongoDriver).queryRunner!.databaseConnection;
        conn.on('commandStarted', (event) => logger.debug('commandStarted', event));
        conn.on('commandSucceeded', (event) => logger.debug('commandSucceeded', event));
        conn.on('commandFailed', (event) => logger.error('commandFailed', event));
    }

    const tokenStrategy: TokenStrategyInterface = Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt);
    Container.set('tokenStrategy', tokenStrategy);

    const app = express();

    const authService: AuthService = Container.get<AuthService>(AuthService);
    const validation: ValidatorOptions = {
        validationError: {
            target: false,
            value: false,
        },
    };

    const routingControllersOptions: RoutingControllersOptions = {
        authorizationChecker: authService.getAuthorizationChecker(),
        currentUserChecker: authService.getCurrentUserChecker(),
        controllers: [`${projectDir}/src/controller/*.ts`],
        middlewares: [`${projectDir}/src/middleware/*.ts`],
        validation: validation,
        classTransformer: true,
        defaultErrorHandler: false,
    };

    useExpressServer(app, routingControllersOptions);

    if (config.swagger.enabled) {
        const { defaultMetadataStorage } = require('class-transformer/cjs/storage');
        const schemas = validationMetadatasToSchemas({
            classTransformerMetadataStorage: defaultMetadataStorage,
            refPointerPrefix: '#/components/schemas/',
        });
        const storage = getMetadataArgsStorage();
        const spec = routingControllersToSpec(storage, routingControllersOptions, {
            components: {
                schemas: {
                    schema: schemas,
                },
                securitySchemes: {
                    basicAuth: {
                        scheme: 'basic',
                        type: 'http',
                    },
                },
            },
            info: {
                description: config.app.description,
                title: config.app.name,
                version: config.app.version,
            },
        });
        app.use(
            config.swagger.route,
            basicAuth({
                users: {
                    [config.swagger.username]: config.swagger.password,
                },
                challenge: true,
            }),
            swaggerUiExpress.serve,
            swaggerUiExpress.setup(spec)
        );
    }

    const port = config.app.port;

    return { app, dataSource, port, logger };
};