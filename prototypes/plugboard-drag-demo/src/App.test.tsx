import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders plugboard letters', () => {
  render(<App />);
  expect(screen.getByText('A')).toBeInTheDocument();
});
