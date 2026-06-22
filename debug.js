const fetch = require('node-fetch');

async function check() {
  try {
    // We don't have token, but maybe we can just start a quick express server or add a console.log to the backend?
    console.log("We need to check the backend.");
  } catch (e) {
    console.error(e);
  }
}
check();
