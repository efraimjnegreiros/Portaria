const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.sqlite' });

const sequelize = new Sequelize('portaria', 'root', '11042008', {
  host: '127.0.0.1',
  port: 3306,  
  dialect: 'mysql',
  timezone: '-03:00', 
});

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

// Teste a conexão
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o MySQL estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MySQL:', err);
  });

module.exports = { Visit, sequelize };
