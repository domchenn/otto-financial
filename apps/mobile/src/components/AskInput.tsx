import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ArrowUpIcon } from './icons';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** The Ask field: gray surface pill with an ink send button that wakes up once there's text. */
export function AskInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (text: string) => void;
}) {
  const { palette } = useTheme();
  const [text, setText] = useState('');
  const ready = text.trim().length > 0;
  const send = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    onSubmit(value);
  };
  return (
    <View style={[styles.wrap, { backgroundColor: palette.surface }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={[styles.input, typeScale.body, { color: palette.ink, fontSize: 16 }]}
        returnKeyType="send"
        onSubmitEditing={send}
        accessibilityLabel={placeholder}
      />
      <Pressable
        onPress={send}
        disabled={!ready}
        accessibilityRole="button"
        accessibilityLabel="Send"
        accessibilityState={{ disabled: !ready }}
        style={({ pressed }) => [
          styles.send,
          {
            backgroundColor: ready ? palette.action : palette.raised,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <ArrowUpIcon color={ready ? palette.actionText : palette.faint} size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingLeft: space.lg + 2,
    paddingRight: 6,
    height: 56,
  },
  input: { flex: 1, height: '100%' },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
