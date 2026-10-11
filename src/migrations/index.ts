import * as migration_20261009_154642_initial from './20261009_154642_initial';
import * as migration_20261011_125847_bank_transfer from './20261011_125847_bank_transfer';

export const migrations = [
  {
    up: migration_20261009_154642_initial.up,
    down: migration_20261009_154642_initial.down,
    name: '20261009_154642_initial',
  },
  {
    up: migration_20261011_125847_bank_transfer.up,
    down: migration_20261011_125847_bank_transfer.down,
    name: '20261011_125847_bank_transfer'
  },
];
