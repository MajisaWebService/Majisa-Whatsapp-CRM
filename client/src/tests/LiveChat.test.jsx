import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveChat } from '../pages/LiveChat.jsx';
import { vi } from 'vitest';

const mockRequest = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    token: 'test-token',
    request: mockRequest,
  }),
}));

const mockChatsData = {
  success: true,
  data: [
    {
      _id: 'chat123',
      customer: {
        _id: 'customer456',
        customerId: '9999900000@c.us',
        name: 'Bob Marley',
        phone: '9999900000',
        isBotPaused: false,
        notes: 'Likes reggae',
        assignedTo: 'Admin'
      },
      lastMessage: 'Stir it up',
      unreadCount: 1,
      updatedAt: '2026-07-04T07:00:00.000Z'
    }
  ]
};

const mockMessagesData = {
  success: true,
  data: [
    {
      _id: 'msg789',
      customer: 'customer456',
      sender: 'CUSTOMER',
      message: 'Stir it up',
      type: 'TEXT',
      createdAt: '2026-07-04T07:00:00.000Z'
    }
  ]
};

describe('LiveChat Console Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat list with active conversations', async () => {
    mockRequest.mockResolvedValue({
      json: () => Promise.resolve(mockChatsData),
      ok: true,
    });

    render(<LiveChat />);

    await waitFor(() => {
      expect(screen.getByText('Bob Marley')).toBeInTheDocument();
      expect(screen.getByText('Stir it up')).toBeInTheDocument();
    });
  });

  it('loads message thread and displays Delete Chat button when chat is selected', async () => {
    // 1st request for chats list, 2nd for active chat messages, 3rd for markRead
    mockRequest
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockChatsData),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockMessagesData),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
        ok: true,
      });

    render(<LiveChat />);

    // Click on Bob Marley conversation
    const chatItem = await screen.findByText('Bob Marley');
    fireEvent.click(chatItem);

    // Verify messages and action buttons render
    await waitFor(() => {
      expect(screen.getByText('CRM Control Card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🗑️ Delete Chat' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '👤 Hide Card' })).toBeInTheDocument();
    });
  });

  it('prompts confirmation and deletes chat conversation when Delete Chat is clicked', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();

    // Mock initial requests
    mockRequest
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockChatsData),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockMessagesData),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
        ok: true,
      });

    render(<LiveChat />);

    const chatItem = await screen.findByText('Bob Marley');
    fireEvent.click(chatItem);

    await screen.findByRole('button', { name: '🗑️ Delete Chat' });

    // Mock the delete request itself, and the subsequent fetchChats list reload
    mockRequest
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
        ok: true,
      });

    // Click delete
    fireEvent.click(screen.getByRole('button', { name: '🗑️ Delete Chat' }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this chat conversation? This will permanently delete the conversation listing and all its message history.'
      );
      expect(window.alert).toHaveBeenCalledWith('Chat deleted successfully.');
      expect(screen.queryByText('CRM Control Card')).not.toBeInTheDocument();
      expect(screen.getByText('Select a conversation to start messaging')).toBeInTheDocument();
    });
  });
});
