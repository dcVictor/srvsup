const ldap = require('ldapjs');

function autenticarNoAD(username, password) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: 'ldap://192.168.1.101', // Use o IP correto do seu Domain Controller
      connectTimeout: 5000
    });

    // Captura erros de conexão para não derrubar o Node
    client.on('error', (err) => {
      reject(new Error('Erro de conexão com o AD: ' + err.message));
    });

    const userPrincipalName = `${username}@zagonel.com.br`;

    client.bind(userPrincipalName, password, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error('Usuário ou senha incorretos.'));
      }
      client.unbind();
      resolve(true);
    });
  });
}

// ESTA LINHA É CRUCIAL:
module.exports = { autenticarNoAD };