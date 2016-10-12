const monzo = require('../monzo');
const async = require('async');
const utils = require('../utils');

module.exports = function () {
  const monzoUser = monzo.monzoUser(utils.getAndValidiateMonzoAuthToken(this));
  if (!monzoUser) return;

  monzoUser.getAccounts().then((accounts) => {
    const responseParts = [];

    async.mapLimit(accounts, 4,
      (account, callback) => {
        monzoUser.getBalance(account.id).then((balanceResponse) => {
          account.balance = balanceResponse;
          callback(null, account);
        });
      },
      (err, accountsWithBalances) => {
        if (err) console.error(err);
        if (accountsWithBalances.length > 1) {
          responseParts.push(`You have ${accounts.length} accouts with Monzo, their balances are:`);
          accountsWithBalances.forEach((account) => {
            responseParts.push(`${account.description}'s account has a balance of ${utils.currencyToWords(account.balance.balance, account.balance.currency)}.`);
          });
        } else {
          responseParts.push(`The balance for ${accountsWithBalances[0].description}'s account is ${utils.currencyToWords(accountsWithBalances[0].balance.balance, accountsWithBalances[0].balance.currency)}`);
        }

        this.emit(':tell', responseParts.join(' '));
      }
    );
  }).catch(utils.handleMonzoError.bind(this));
};