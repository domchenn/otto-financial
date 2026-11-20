import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AskInput } from './AskInput';

describe('AskInput', () => {
  it('keeps send disabled until there is text', async () => {
    const onSubmit = jest.fn();
    await render(<AskInput placeholder="Ask about your money…" onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Ask about your money…'), '  ');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Ask about your money…'), 'Summarize my week');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith('Summarize my week');
  });
});
