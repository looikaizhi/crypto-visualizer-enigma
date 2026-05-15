import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/EnigmaSimulator', () => () => (
  <div>Enigma Simulator</div>
));

test('renders app entry', () => {
  render(<App />);
  expect(screen.getByText(/enigma simulator/i)).toBeInTheDocument();
});
