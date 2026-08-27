import { getMachines } from '../backend/controllers/machineController.js';

const req = {
  query: {
    paginated: 'true',
    page: 1,
    limit: 10
  }
};

const res = {
  json: (data) => console.log('SUCCESS:', JSON.stringify(data)),
  status: (code) => {
    console.log('STATUS:', code);
    return {
      json: (data) => console.log('ERROR JSON:', data)
    };
  }
};

getMachines(req, res);
