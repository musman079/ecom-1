import { URLSearchParams } from 'node:url';

const base = 'http://localhost:3000';
const csrfUrl = `${base}/api/auth/csrf`;
const target = `${base}/api/auth/callback/credentials`;
const email = process.env.ADMIN_USER_EMAIL || 'admin@example.com';
const password = process.env.ADMIN_USER_PASSWORD || 'Admin@123456';

function extractCookies(setCookieHeaders) {
  if (!setCookieHeaders) return [];
  if (Array.isArray(setCookieHeaders)) return setCookieHeaders.map((h) => h.split(';')[0]);
  return [setCookieHeaders.split(';')[0]];
}

console.log(`GET ${csrfUrl} to get csrf token and cookies`);

try {
  const csrfRes = await fetch(csrfUrl, { method: 'GET', redirect: 'manual' });
  const setCookies = csrfRes.headers.get('set-cookie');
  const cookies = extractCookies(setCookies);
  const csrfBody = await csrfRes.json();
  const csrfToken = csrfBody.csrfToken;

  console.log('Got csrfToken:', csrfToken ? '[present]' : '[missing]');
  console.log('Cookies from csrf:', cookies.join('; '));

  const params = new URLSearchParams();
  params.set('csrfToken', csrfToken || '');
  params.set('email', email);
  params.set('password', password);

  console.log(`POST ${target} with email=${email}`);

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Cookie: cookies.join('; '),
    },
    body: params.toString(),
    redirect: 'manual',
  });

  console.log('Status:', res.status, res.statusText);
  console.log('Response set-cookie headers:');
  const setCookieHeader = res.headers.get('set-cookie') || '';
  let receivedCookies = [];
  if (setCookieHeader) {
    console.log('SET-COOKIE (raw):', setCookieHeader);
    const sessionMatch = setCookieHeader.match(/next-auth\.session-token=([^;\s,]+)/);
    if (sessionMatch) {
      const kv = `next-auth.session-token=${sessionMatch[1]}`;
      receivedCookies.push(kv);
      console.log('Extracted cookie:', kv);
    }
    const callbackMatch = setCookieHeader.match(/next-auth\.callback-url=([^;\s,]+)/);
    if (callbackMatch) {
      receivedCookies.push(`next-auth.callback-url=${callbackMatch[1]}`);
    }
  } else {
    console.log('[none]');
  }

  console.log('Location:', res.headers.get('location'));
  const text = await res.text();
  console.log('\nBody snippet:', text.slice(0, 1000));

  // If we have a session cookie, call /api/auth/me to verify
  const meUrl = `${base}/api/auth/me`;
  if (receivedCookies.length > 0) {
    console.log('\nGET', meUrl, 'with received cookies');
    const meRes = await fetch(meUrl, {
      method: 'GET',
      headers: { Cookie: receivedCookies.join('; '), Accept: 'application/json' },
    });

    console.log('me status:', meRes.status, meRes.statusText);
    try {
      const meJson = await meRes.json();
      console.log('me body:', JSON.stringify(meJson, null, 2).slice(0, 2000));
    } catch (e) {
      console.log('me response not json or empty');
    }
  } else {
    console.log('No session cookie to test /api/auth/me');
  }

  // Also try NextAuth's built-in session endpoint
  if (receivedCookies.length > 0) {
    const sessionUrl = `${base}/api/auth/session`;
    console.log('\nGET', sessionUrl, 'with received cookies');
    const sRes = await fetch(sessionUrl, { headers: { Cookie: receivedCookies.join('; '), Accept: 'application/json' } });
    console.log('session status:', sRes.status, sRes.statusText);
    try {
      const sJson = await sRes.json();
      console.log('session body:', JSON.stringify(sJson, null, 2).slice(0, 2000));
    } catch (e) {
      console.log('session response not json or empty');
    }
  }
} catch (err) {
  console.error('Request failed:', err.message || err);
  process.exit(1);
}
