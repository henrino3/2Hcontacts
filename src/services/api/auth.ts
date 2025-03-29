import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/auth';

export async function login(email: string, password: string): Promise<{ token: string, user: any }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    const { token, user } = response.data;
    // Return token and user, let useAuth handle storage
    return { token, user };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'Login failed');
  }
} 