import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    required: true,
  },
  conta: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    //Valida se a nota inserida e' menor que zero
    validate(balance) {
      if (balance < 0) throw new Error('Valor negativo para balance');
    },
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
});

const accountModel = mongoose.model('account', accountSchema, 'accounts');

export { accountModel };
