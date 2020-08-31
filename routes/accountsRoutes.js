import express from 'express';
import { accountModel } from '../models/account.js';

const app = express();

//ITEM 4 - DEPÓSITO
app.patch('/deposito', async (req, res) => {
  const { agencia, conta, valor } = req.body;
  try {
    const operation = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });

    if (!operation) {
      res.status(404).send(`Conta ${conta} não existe`);
    }

    operation.balance += valor;
    operation.lastModified = Date.now();

    await operation.save();
    const retorno = { nome: operation.name, saldoAtual: operation.balance };
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 5 - SAQUE
app.patch('/saque', async (req, res) => {
  const { agencia, conta, valor } = req.body;
  try {
    const operation = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });

    if (!operation) {
      res.status(404).send(`Conta ${conta} não existe`);
    }

    if (valor + 1 > operation.balance) {
      res
        .status(404)
        .send(
          `Conta ${conta} não possui saldo suficiente, o saldo atual é ${operation.balance}`
        );
    }

    operation.balance -= valor + 1;
    operation.lastModified = Date.now();

    await operation.save();
    const retorno = { nome: operation.name, saldoAtual: operation.balance };
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 6 - SALDO
app.get('/saldo', async (req, res) => {
  const { agencia, conta } = req.body;
  try {
    const operation = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });

    if (!operation) {
      res.status(404).send(`Conta ${conta} não existe`);
    }
    const retorno = { nome: operation.name, saldoAtual: operation.balance };
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 7 - EXCLUSÃO (FALTA FAZER A EXCLUSÃO, ESTÁ APENAS LISTANDO)
app.delete('/exclusao', async (req, res) => {
  const { agencia, conta } = req.body;
  try {
    //const operation = await accountModel.findOne({
    const operation = await accountModel.findOneAndDelete({
      $and: [{ agencia: agencia }, { conta: conta }],
    });
    if (!operation) {
      res.status(404).send(`Conta ${conta} não encontrada`);
    }
    // const retorno = { nome: operation.name, saldoAtual: operation.balance };
    const resultado = await accountModel
      .find({ agencia: agencia })
      .sort({ conta: 1 });
    res.status(200).send(resultado);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 8 - TRANSFERÊNCIA
app.patch('/transfer', async (req, res) => {
  const { contaOrigem, contaDestino, valor } = req.body;
  try {
    const origem = await accountModel.findOne({ conta: contaOrigem });

    const destino = await accountModel.findOne({ conta: contaDestino });

    if (!origem && !destino) {
      res
        .status(404)
        .send(
          `Contas de origem (${contaOrigem}) e de destino (${contaDestino}) não existem`
        );
    }

    if (!origem) {
      res.status(404).send(`Conta de origem (${contaOrigem}) não existe`);
    }

    if (!destino) {
      res.status(404).send(`Conta de destino (${contaDestino}) não existe`);
    }

    if (origem.conta === destino.conta) {
      res.status(404).send(`Contas de origem e destino não podem ser iguais`);
    }

    let tarifa = 0;
    if (origem.agencia !== destino.agencia) {
      tarifa = 8;
    }

    if (valor + tarifa > origem.balance) {
      res
        .status(404)
        .send(
          `Conta de origem ${origem} não possui saldo suficiente, o saldo atual é ${origem.balance}`
        );
    }

    origem.balance -= valor + tarifa;
    destino.balance += valor;

    origem.lastModified = Date.now();
    destino.lastModified = Date.now();

    await origem.save();
    await destino.save();

    const retorno = [
      { Origem: origem.name, saldoAtualOrigem: origem.balance },
      { Destino: destino.name, saldoAtualDestino: destino.balance },
    ];
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 9 - MÉDIA DA AGÊNCIA
app.get('/mediaAgencia', async (req, res) => {
  try {
    const { agencia } = req.body;
    const operation = await accountModel.find({ agencia: agencia });
    if (!operation || !operation.length) {
      res.status(404).send(`Agência não existe`);
    } else {
      const total = operation.reduce((acum, cur) => {
        return (acum += cur.balance);
      }, 0);

      const retorno = {
        total,
        qtde: operation.length,
        media: total / operation.length,
      };
      res.status(200).send(retorno);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 10 - MENOR SALDO
app.get('/menorSaldo', async (req, res) => {
  const { quantidade } = req.body;
  try {
    if (quantidade < 1) res.send('Quantidade deve ser maior do que zero');
    const operation = await accountModel
      .find({}, { _id: 0 })
      .sort({ balance: 1 })
      .limit(quantidade);

    res.status(200).send(operation);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 11 - MAIS RICO
app.get('/maisRico', async (req, res) => {
  const { quantidade } = req.body;
  try {
    if (quantidade < 1) res.send('Quantidade deve ser maior do que zero');
    const operation = await accountModel
      .find({}, { _id: 0 })
      .sort({ balance: -1, name: 1 })
      .limit(quantidade);

    res.status(200).send(operation);
  } catch (err) {
    res.status(500).send(err);
  }
});

//ITEM 12 -TRANSFERÊNCIA DOS MAIS RICOS
app.patch('/transferRicos', async (_req, res) => {
  try {
    const agencias = await accountModel.distinct('agencia');
    agencias.forEach(async (ag) => {
      const rico = await accountModel
        .findOne({ agencia: ag })
        .sort({ balance: -1 });
      rico.agencia = 99;
      rico.lastModified = Date.now();
      await rico.save();
    });

    const agencia99 = await accountModel
      .find({ agencia: 99 }, { _id: 0 })
      .sort({ conta: 1 });

    res.status(200).send(agencia99);
  } catch (err) {
    res.status(500).send(err);
  }
});

/* Aqui está o SALDO COM PUT - ITEM 6B - PARA TESTAR GIT*/
app.get('/saldo', async (req, res) => {
  const { agencia, conta } = req.body;
  try {
    const operation = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });

    if (!operation) {
      res.status(404).send(`Conta ${conta} não existe`);
    }
    const retorno = { nome: operation.name, saldoAtual: operation.balance };
    res.status(200).send(retorno);
  } catch (err) {
    res.status(500).send(err);
  }
});

export { app as accountRouter };
