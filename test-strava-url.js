// Test rapide pour voir l'URL générée par le backend
const STRAVA_CLIENT_ID = '258796';
const STRAVA_REDIRECT_URI = 'http://localhost:3000/strava/connect';

const params = new URLSearchParams({
  client_id: STRAVA_CLIENT_ID,
  redirect_uri: STRAVA_REDIRECT_URI,
  response_type: 'code',
  approval_prompt: 'auto',
  scope: 'read,activity:read_all',
  state: 'test-state-123'
});

const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

console.log('\n🔗 URL générée par le backend:\n');
console.log(url);
console.log('\n📋 Paramètres:');
console.log('  - client_id:', STRAVA_CLIENT_ID);
console.log('  - redirect_uri:', STRAVA_REDIRECT_URI);
console.log('\n✅ Après autorisation, Strava devrait rediriger vers:');
console.log('  ', STRAVA_REDIRECT_URI + '?code=XXXX&state=test-state-123');
console.log('');
