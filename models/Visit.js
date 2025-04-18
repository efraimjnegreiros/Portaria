const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.sqlite' });
// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: './database.sqlite',
//   timezone: '-03:00', // Horário de Brasília
//   dialectOptions: {
//     useUTC: false // desabilita UTC para sqlite
//   }
// });

const Visit = sequelize.define('Visit', {
  nome: DataTypes.STRING,
  documento: DataTypes.STRING,
  data: DataTypes.STRING,
  empresa: DataTypes.STRING,
  responsavel: DataTypes.STRING,
  terceirizado: DataTypes.STRING,
  realizado: {
    type: DataTypes.STRING,
    defaultValue: 'Não'
  }
});

module.exports = { Visit, sequelize };
