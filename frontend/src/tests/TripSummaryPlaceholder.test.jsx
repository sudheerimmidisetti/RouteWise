import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TripSummaryPlaceholder from '../components/TripSummaryPlaceholder';

describe('TripSummaryPlaceholder Component', () => {
  it('renders awaiting form state when no data is passed', () => {
    render(<TripSummaryPlaceholder />);
    expect(screen.getByText('Awaiting Form')).toBeInTheDocument();
  });

  it('renders calculated trip data when trip props are provided', () => {
    const mockData = {
      total_distance: 500.5,
      total_duration: 8.25,
      current_location: 'New York, NY',
      pickup_location: 'Philadelphia, PA',
      dropoff_location: 'Chicago, IL',
    };
    render(<TripSummaryPlaceholder data={mockData} />);
    expect(screen.getByText('500.5 miles')).toBeInTheDocument();
    expect(screen.getByText('8.25 hours')).toBeInTheDocument();
  });
});
