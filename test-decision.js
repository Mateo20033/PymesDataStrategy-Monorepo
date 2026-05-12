const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'cmnrh2vgo0001qzdnva9ax5k6' }, 'dev-jwt-secret-change-in-production', { expiresIn: '1h' });

fetch('http://localhost:3000/api/v1/datasets/fdd9d39e-2ca9-4025-863d-e710757f6fa0/decisions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    decisions: [{
      anomalyId: '647d6623-aeab-4dee-a73b-f24d96ef5e5d',
      action: 'CORRECTED',
      correction: 'usa el promedio'
    }]
  })
}).then(async res => {
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}).catch(console.error);
