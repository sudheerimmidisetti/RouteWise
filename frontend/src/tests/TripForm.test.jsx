import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TripForm from '../components/TripForm';

describe('TripForm Component', () => {
  it('renders all 4 required fields', () => {
    render(<TripForm />);
    expect(screen.getByPlaceholderText('e.g. New York, NY')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Philadelphia, PA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Chicago, IL')).toBeInTheDocument();
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

  it('submits valid data when form inputs are filled', () => {
    const handleSubmit = vi.fn();
    render(<TripForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. New York, NY'), { target: { value: 'New York, NY' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Philadelphia, PA'), { target: { value: 'Philadelphia, PA' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Chicago, IL'), { target: { value: 'Chicago, IL' } });

    const submitBtn = screen.getByRole('button', { name: /Calculate Route/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith({
      currentLocation: 'New York, NY',
      pickupLocation: 'Philadelphia, PA',
      dropoffLocation: 'Chicago, IL',
      currentCycleUsed: '0',
    });
  });
});
