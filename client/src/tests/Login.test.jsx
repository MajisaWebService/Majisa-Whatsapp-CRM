import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../pages/Login.jsx';
import { vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogin = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('Login Page Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form properly', () => {
    render(<Login />);
    expect(screen.getByText('MAJISA CRM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@majisa.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Access CRM' })).toBeInTheDocument();
  });

  it('successfully redirects on valid credentials submit', async () => {
    mockLogin.mockResolvedValue({ success: true });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('admin@majisa.com'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Access CRM' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123', false);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays validation error alert on login failure', async () => {
    mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials' });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('admin@majisa.com'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Access CRM' }));

    await waitFor(() => {
      expect(screen.getByText('⚠️ Invalid credentials')).toBeInTheDocument();
    });
  });
});
