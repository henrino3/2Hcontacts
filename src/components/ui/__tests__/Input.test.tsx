import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Test placeholder" onChangeText={() => {}} />
    );
    
    expect(getByPlaceholderText('Test placeholder')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Test placeholder" onChangeText={onChangeText} />
    );
    
    fireEvent.changeText(getByPlaceholderText('Test placeholder'), 'new text');
    expect(onChangeText).toHaveBeenCalledWith('new text');
  });
}); 