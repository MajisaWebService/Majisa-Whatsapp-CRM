import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.alert and window.confirm
window.alert = vi.fn();
window.confirm = vi.fn().mockReturnValue(true);

// Mock global fetch
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: [] }),
    ok: true,
  })
);

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const socketMock = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
  };
  return {
    io: vi.fn().mockReturnValue(socketMock),
    default: vi.fn().mockReturnValue(socketMock),
  };
});

// Mock SidebarContext
vi.mock('../context/SidebarContext.jsx', () => ({
  useSidebar: () => ({
    isOpen: false,
    toggle: vi.fn(),
  }),
}));

// Mock SocketContext
vi.mock('../context/SocketContext.jsx', () => {
  const socketMock = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  return {
    useSocket: () => ({
      socket: socketMock,
      whatsappStatus: 'connected',
      whatsappQR: '',
      incomingMessage: null,
      notifications: [],
      unreadNotifCount: 0,
      setUnreadNotifCount: vi.fn(),
    }),
  };
});
