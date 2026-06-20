import Cookies from 'js-cookie';

const base_url = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';
const API_BASE = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;

class JBookAPI {
  constructor() {
    this.token = null;
  }
  
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      Cookies.set('access_token', token, { expires: 7 });
    }
  }
  
  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = Cookies.get('access_token');
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

  // Custom Modules
  getCustomModules() {
    return this.request('/content/custom-modules');
  }

  getCustomModule(id) {
    return this.request(`/content/custom-modules/${id}`);
  }

  getCustomModuleQuestions(id) {
    return this.request(`/content/custom-modules/${id}/questions`);
  }

  submitCustomModuleAnswers(id, answers) {
    return this.request(`/content/custom-modules/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }

  // Admin Custom Modules
  adminGetCustomModules() {
    return this.request('/admin/custom-modules');
  }

  adminCreateCustomModule(data) {
    return this.request('/admin/custom-modules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  adminUpdateCustomModule(id, data) {
    return this.request(`/admin/custom-modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  adminDeleteCustomModule(id) {
    return this.request(`/admin/custom-modules/${id}`, {
      method: 'DELETE'
    });
  }

  adminGetCustomModuleQuestions(id) {
    return this.request(`/admin/custom-modules/${id}/questions`);
  }

  adminDeleteCustomModuleQuestion(id) {
    return this.request(`/admin/custom-questions/${id}`, {
      method: 'DELETE'
    });
  }

  async adminUploadCustomModuleExcel(id, file) {
    const url = `${API_BASE}/admin/custom-modules/${id}/upload-excel`;
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    } catch (e) {
      console.error('API request error:', e);
      throw e;
    }
  }
}

export const jbookApi = new JBookAPI();
