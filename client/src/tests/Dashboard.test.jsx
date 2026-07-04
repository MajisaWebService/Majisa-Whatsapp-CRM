import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../pages/Dashboard.jsx';
import { vi } from 'vitest';

const mockRequest = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    token: 'test-token',
    request: mockRequest,
  }),
}));

const mockStatsData = {
  success: true,
  data: {
    cards: {
      totalCustomers: 12,
      todaysLeads: 2,
      newLeads: 5,
      inProgressLeads: 3,
      talkToExecutiveLeads: 1,
      todaysMessages: 15,
      activeChats: 4,
      completedProjects: 6,
      activeProjects: 2,
      totalRevenue: 150000,
      realizedRevenue: 75000
    },
    recentConversations: [
      {
        _id: 'conv1',
        customer: { name: 'Alice Customer', phone: '9999900001', service: 'Website Development' },
        lastMessage: 'I need a custom quote'
      }
    ],
    recentNotifications: [
      {
        _id: 'notif1',
        type: 'NEW_LEAD',
        title: 'New Lead Created',
        message: 'Alice Customer needs assignment',
        createdAt: '2026-07-04T07:00:00.000Z'
      }
    ],
    charts: {
      leadsTrend: [{ label: 'Mon', count: 2 }],
      revenueTrend: [{ label: 'Jul', revenue: 75000 }],
      serviceDistribution: [{ name: 'Website Development', count: 1 }],
      statusDistribution: [{ name: 'New Lead', count: 1 }]
    }
  }
};

describe('Dashboard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockRequest.mockReturnValue(new Promise(() => {})); // Keeps it in loading state
    render(<Dashboard />);
    expect(screen.getByText('Loading dashboard metrics...')).toBeInTheDocument();
  });

  it('renders metrics and listings after fetch resolves', async () => {
    mockRequest.mockResolvedValue({
      json: () => Promise.resolve(mockStatsData),
      ok: true,
    });

    render(<Dashboard />);

    await waitFor(() => {
      // Check that Total Customers metric card is rendered
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      
      // Check table listings
      expect(screen.getByText('Alice Customer')).toBeInTheDocument();
      expect(screen.getByText('I need a custom quote')).toBeInTheDocument();
      
      // Check notifications
      expect(screen.getByText('New Lead Created')).toBeInTheDocument();
      expect(screen.getByText('Alice Customer needs assignment')).toBeInTheDocument();
    });
  });
});
