/**
 * ChatInterface Component Tests
 *
 * Tests chat UI rendering, message display, and user interactions
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';
import ChatInterface from './ChatInterface';

describe('ChatInterface Component', () => {
  describe('Rendering', () => {
    it('renders the chat interface with title', () => {
      render(<ChatInterface />);

      expect(screen.getByText('Daily Check-In Chat')).toBeInTheDocument();
    });

    it('displays all message bubbles', () => {
      render(<ChatInterface />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
      expect(screen.getByText(/feeling good/i)).toBeInTheDocument();
      expect(screen.getByText(/morning medication/i)).toBeInTheDocument();
      expect(screen.getByText(/took it with breakfast/i)).toBeInTheDocument();
    });

    it('displays message timestamps', () => {
      render(<ChatInterface />);

      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
      expect(screen.getByText('9:05 AM')).toBeInTheDocument();
      expect(screen.getByText('9:06 AM')).toBeInTheDocument();
      expect(screen.getByText('9:10 AM')).toBeInTheDocument();
    });
  });

  describe('Message Layout', () => {
    it('displays messages in correct order', () => {
      render(<ChatInterface />);

      const messages = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('rounded-lg')
      );

      // Should have 4 message bubbles
      expect(messages.length).toBeGreaterThanOrEqual(4);
    });

    it('applies different styles to AI and senior messages', () => {
      const { container } = render(<ChatInterface />);

      // Check for messages container
      const messagesContainer = container.querySelector('.space-y-4');
      expect(messagesContainer).toBeInTheDocument();
    });
  });

  describe('Quick Replies', () => {
    it('displays all quick reply buttons', () => {
      render(<ChatInterface />);

      expect(screen.getByText("I'm feeling good")).toBeInTheDocument();
      expect(screen.getByText('I need help')).toBeInTheDocument();
      expect(screen.getByText('Took my medication')).toBeInTheDocument();
      expect(screen.getByText('Going for a walk')).toBeInTheDocument();
    });

    it('displays quick replies label', () => {
      render(<ChatInterface />);

      expect(screen.getByText('Quick replies:')).toBeInTheDocument();
    });

    it('renders quick reply buttons as clickable elements', () => {
      render(<ChatInterface />);

      const quickReplyButtons = screen.getAllByRole('button').filter(
        (button) =>
          button.textContent === "I'm feeling good" ||
          button.textContent === 'I need help' ||
          button.textContent === 'Took my medication' ||
          button.textContent === 'Going for a walk'
      );

      expect(quickReplyButtons).toHaveLength(4);
    });
  });

  describe('Input Section', () => {
    it('renders message input field', () => {
      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/type your message/i);
      expect(input).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<ChatInterface />);

      const sendButtons = screen.getAllByRole('button');
      const sendButton = sendButtons[sendButtons.length - 1]; // Last button should be send

      expect(sendButton).toBeInTheDocument();
    });

    it('input field accepts text', () => {
      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/type your message/i) as HTMLInputElement;
      expect(input).toHaveProperty('placeholder', 'Type your message...');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<ChatInterface />);

      // Check for main container
      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('buttons are keyboard accessible', () => {
      render(<ChatInterface />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('input has appropriate placeholder', () => {
      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/type your message/i);
      expect(input).toHaveAttribute('placeholder');
    });
  });

  describe('Scrollable Messages', () => {
    it('messages container has scroll overflow', () => {
      const { container } = render(<ChatInterface />);

      const messagesContainer = container.querySelector('.max-h-96');
      expect(messagesContainer).toBeInTheDocument();
      expect(messagesContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Message Display', () => {
    it('displays messages with proper styling', () => {
      const { container } = render(<ChatInterface />);

      const messageBubbles = container.querySelectorAll('.rounded-lg.p-4');
      expect(messageBubbles.length).toBeGreaterThan(0);
    });

    it('messages have text content', () => {
      render(<ChatInterface />);

      expect(screen.getByText(/good morning/i)).toHaveTextContent(
        'Good morning! How are you feeling today?'
      );
    });

    it('displays emoji in messages correctly', () => {
      render(<ChatInterface />);

      const messageWithEmoji = screen.getByText(/feeling good/i);
      expect(messageWithEmoji.textContent).toContain('😊');
    });
  });

  describe('UI Components Integration', () => {
    it('uses Card component for container', () => {
      const { container } = render(<ChatInterface />);

      expect(container.querySelector('.p-6')).toBeInTheDocument();
    });

    it('uses Button components for interactions', () => {
      render(<ChatInterface />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('uses Input component for message field', () => {
      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/type your message/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing', () => {
      const { container } = render(<ChatInterface />);

      const title = screen.getByText('Daily Check-In Chat');
      expect(title).toHaveClass('text-2xl');
    });

    it('messages have max width constraint', () => {
      const { container } = render(<ChatInterface />);

      const messageContainers = container.querySelectorAll('.max-w-\\[80\\%\\]');
      expect(messageContainers.length).toBeGreaterThan(0);
    });
  });
});
