import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TripForm from '../components/TripForm';

describe('TripForm Component', () => {
  it('renders all 4 required fields', () => {
    render(<TripForm />);
    expect(screen.getByPlaceholderText(/New York/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Philadelphia/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Chicago/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 0')).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', () => {
    const handleSubmit = vi.fn();
    render(<TripForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Calculate Route/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Current location is required.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
