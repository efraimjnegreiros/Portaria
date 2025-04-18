const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const { sequelize } = require('./models/Visit');
const visitRoutes = require('./routes/visits');
const app = express();
const engine = require('ejs-locals'); // importar aqui

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use('/', visitRoutes);
app.engine('ejs', engine); // usar ejs-locals como engine
app.set('view engine', 'ejs');
sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
  });
});
