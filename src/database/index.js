import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import databaseConfig from '../config/database';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

const models = [User, File, Appointment];
class Database {
  constructor() {
    this.init();
    this.mongodb();
  }

  init() {
    // Conexão com a base de dados
    this.connection = new Sequelize(databaseConfig);

    models
      .map((model) => model.init(this.connection))
      .map(
        (model) =>
          model && model.associate && model.associate(this.connection.models)
      );
  }

  mongodb() {
    this.mongooseConnect = mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    });
  }
}

export default new Database();
