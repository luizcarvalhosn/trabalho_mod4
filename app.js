/*Imports e inicializações*/

import express from 'express';
import mongoose from 'mongoose';

import { accountRouter } from './routes/accountsRoutes.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(accountRouter);

/*Conexao com o banco de dados do MongoDB*/
(async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://' +
        process.env.USERDB +
        ':' +
        process.env.PWDDB +
        '@cluster0.3hiuq.gcp.mongodb.net/trabalho?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado no MongoDB');
  } catch (error) {
    console.log('Erro ao conectar no MongoDB: ' + error);
  }
})();

app.listen(process.env.PORT, () => console.log('Servidor em execucao'));
