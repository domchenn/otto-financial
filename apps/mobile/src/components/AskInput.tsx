import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ArrowUpIcon } from './icons';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Floating "Ask about your money…" field. The send button turns indigo once there's text. */
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
    <View style={[styles.wrap, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={[styles.input, typeScale.body, { color: palette.ink, fontSize: 18 }]}
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
        <ArrowUpIcon color={ready ? palette.actionText : palette.faint} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingLeft: space.xl,
    paddingRight: 12,
    height: 66,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  input: { flex: 1, height: '100%' },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
