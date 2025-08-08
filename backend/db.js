const oracledb = require('oracledb');
const path = require('path');

process.env.TNS_ADMIN = path.resolve(__dirname, '../Wallet_LIBRARYDB');

oracledb.initOracleClient({
  libDir: path.resolve(__dirname, '../instantclient_23_9')
});

const dbConfig = {
  user: 'USER', 
  password: 'VEiKx48WURNCfgs', 
  connectString: 'librarydb_high' 
};

async function getConnection() {
  return await oracledb.getConnection(dbConfig);
}

module.exports = { getConnection };