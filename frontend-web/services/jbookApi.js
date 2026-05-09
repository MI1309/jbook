const API_BASE = 'https://imronm.pythonanywhere.com/api';

class JBookAPI {
  constructor() {
    this.token = null;
  }
  
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jbook_token', token);
    }
  }
  
  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('jbook_token');
    }
    return this.token;
  }
  
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (response.status === 401) {
        // Token expired
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jbook_token');
        }
        throw new Error("Unauthorized");
      }
      
      return response.json();
    } catch (e) {
      console.error('API request error:', e);
      throw e;
    }
  }
  
  // Auth
  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }
  
  register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  getProfile() {
    return this.request('/auth/me');
  }
  
  // Content
  getKotobaList(params = {}) {
    const queryParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = String(value);
      }
    });
    const query = new URLSearchParams(queryParams).toString();
    return this.request(`/content/kotoba?${query}`);
  }
  
  getRandomKotoba(level) {
    const query = level ? `?level=${level}` : '';
    return this.request(`/content/random-kotoba${query}`);
  }
  
  // Learning
  submitPractice(data) {
    return this.request('/learning/practice/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  getAnalytics() {
    return this.request('/learning/practice/analytics');
  }
}

export const jbookApi = new JBookAPI();
