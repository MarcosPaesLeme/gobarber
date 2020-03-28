// Configuração do nosso server
import 'dotenv/config';
import express from 'express';
import { resolve } from 'path';
import * as Sentry from '@sentry/node';
import 'express-async-errors';

import Youch from 'youch';
import cors from 'cors';
import routes from './routes';
import './database';
import sentryConfig from './config/sentry';

class App {
  constructor() {
    this.server = express();
    this.server.use(cors());
    Sentry.init(sentryConfig);
    this.middleware();
    this.routes();
    this.execptionHandler();
  }

  middleware() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(
      '/files',
      express.static(resolve(__dirname, '..', 'temp', 'uploads'))
    );
    this.server.use(express.json());
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  execptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const erros = await new Youch(err, req).toJSON();
        return res.status(500).json(erros);
      }
      return res.status(500).json({ erros: 'Internal server erros' });
    });
  }
}

export default new App().server;
