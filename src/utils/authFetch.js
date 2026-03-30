// Access Token 만료 시 자동으로 Refresh Token으로 갱신
export async function authFetch(url, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  // FormData인 경우 Content-Type을 지정하지 않음 (브라우저가 자동으로 boundary 포함해서 설정)
  const isFormData = options.body instanceof FormData;

  options.headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
    'Authorization': 'Bearer ' + accessToken
  };

  let res = await fetch(url, options);

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return res;
    }

    const refreshRes = await fetch('/api/users/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem('accessToken', data.accessToken);
      options.headers['Authorization'] = 'Bearer ' + data.accessToken;
      res = await fetch(url, options);
    } else {
      logout();
    }
  }

  return res;
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.replace('/login');
}

export function getTokenPayload() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function isAdmin() {
  const payload = getTokenPayload();
  return payload?.role === 'ROLE_ADMIN';
}

export function isLoggedIn() {
  return !!localStorage.getItem('accessToken');
}
