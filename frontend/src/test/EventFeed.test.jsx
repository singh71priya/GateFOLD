import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventFeed from '../components/EventFeed';

describe('EventFeed', () => {
  it('displays placeholder text when there are no events', () => {
    render(<EventFeed events={[]} connected={true} error={null} />);
    expect(screen.getByText(/Mints, resales, and check-ins will appear here/i)).toBeDefined();
  });

  it('renders streaming state correctly', () => {
    render(<EventFeed events={[]} connected={true} error={null} />);
    expect(screen.getByText('streaming')).toBeDefined();
  });

  it('renders disconnected state correctly', () => {
    render(<EventFeed events={[]} connected={false} error={null} />);
    expect(screen.getByText('connecting')).toBeDefined();
  });

  it('renders a list of events with correct labels', () => {
    const mockEvents = [
      { id: '1', topic: ['ticket_minted'], ledger: 12345 },
      { id: '2', topic: ['entry_verified'], ledger: 12346 },
    ];
    render(<EventFeed events={mockEvents} connected={true} error={null} />);
    
    expect(screen.getByText('Ticket minted')).toBeDefined();
    expect(screen.getByText('ledger #12345')).toBeDefined();
    expect(screen.getByText('Entry verified')).toBeDefined();
    expect(screen.getByText('ledger #12346')).toBeDefined();
  });
});
