import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Error from '../components/Error';

describe('Error Component', () => {
  it('renders custom error title and message', () => {
    render(<Error title="API Failure" message="Service unavailable." />);
    expect(screen.getByText('API Failure')).toBeInTheDocument();
    expect(screen.getByText('Service unavailable.')).toBeInTheDocument();
  });

  it('triggers onRetry callback when retry button is clicked', () => {
    const handleRetry = vi.fn();
    render(<Error onRetry={handleRetry} />);
    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalled();
  });
});
