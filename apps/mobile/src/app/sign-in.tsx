import { useSignIn } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { Button, TextButton } from '@/components/Button';
import { Field } from '@/components/Field';
import { AlertIcon, MailIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { friendly } from '@/lib/authErrors';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Email-code sign-in. Sign-ups are disabled in the Clerk dashboard (restricted mode),
 * so only the owner's existing account can get through.
 */
export default function SignIn() {
  const { signIn, fetchStatus } = useSignIn();
  const { palette } = useTheme();
  const busy = fetchStatus === 'fetching';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendCode() {
    setError(null);
    const { error: sendError } = await signIn.emailCode.sendCode({ emailAddress: email.trim() });
    if (sendError) {
      setError(friendly(sendError));
      return;
    }
    setCode('');
    setResendIn(RESEND_SECONDS);
    setStep('code');
  }

  async function verify(value = code) {
    setError(null);
    const { error: verifyError } = await signIn.emailCode.verifyCode({ code: value.trim() });
    if (verifyError) {
      setError(friendly(verifyError));
      return;
    }
    if (signIn.status === 'complete') {
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) setError(friendly(finalizeError));
    } else {
      setError('This account needs another verification step that Otto doesn’t support yet.');
    }
  }

  const changeEmail = () => {
    setError(null);
    setCode('');
    setStep('email');
  };

  if (step === 'email') {
    return (
      <StepScreen
        keyboard
        hideBack
        heading="What's your email?"
        subheading="We'll send you a 6-digit code. No passwords to remember."
        footer={
          <Footer>
            <Button
              title="Send code"
              onPress={() => void sendCode()}
              loading={busy}
              disabled={!email.includes('@')}
            />
          </Footer>
        }
      >
        <View style={{ marginTop: space.xl }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            autoFocus
            onSubmitEditing={() => void sendCode()}
            error={error}
            hint="Use the email on your Otto account."
          />
        </View>
      </StepScreen>
    );
  }

  return (
    <StepScreen
      keyboard
      onBack={changeEmail}
      heading="Check your inbox"
      subheading={
        <Text variant="body" muted style={{ fontSize: 17, lineHeight: 24, marginTop: space.sm }}>
          Enter the 6-digit code we sent to{'\n'}
          <Text variant="body" weight="bold" style={{ fontSize: 17 }}>
            {email.trim()}
          </Text>
        </Text>
      }
      footer={
        error ? (
          <Footer>
            <Button title="Send a new code" onPress={() => void sendCode()} loading={busy} />
            <Button variant="outline" title="Use a different email" onPress={changeEmail} />
          </Footer>
        ) : (
          <Footer>
            <Button
              title="Verify"
              onPress={() => void verify()}
              loading={busy}
              disabled={code.length < CODE_LENGTH}
            />
          </Footer>
        )
      }
    >
      <CodeBoxes
        value={code}
        error={!!error}
        onChange={(v) => {
          setError(null);
          setCode(v);
          if (v.length === CODE_LENGTH) void verify(v);
        }}
      />
      {error ? (
        <ErrorLine message={error} />
      ) : (
        <>
          <View style={styles.resendRow}>
            {resendIn > 0 ? (
              <Text variant="body" muted tabular>
                Resend code in 0:{String(resendIn).padStart(2, '0')}
              </Text>
            ) : (
              <TextButton title="Resend code" onPress={() => void sendCode()} />
            )}
            <TextButton title="Change email" onPress={changeEmail} />
          </View>
          <Card style={styles.tip}>
            <MailIcon color={palette.muted} size={20} />
            <Text variant="body" muted style={{ flex: 1 }}>
              Can&apos;t find it? Check spam or Promotions. The code expires in 10 minutes.
            </Text>
          </Card>
        </>
      )}
    </StepScreen>
  );
}

function ErrorLine({ message }: { message: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.error}>
      <AlertIcon color={palette.alert} size={22} />
      <Text
        variant="body"
        weight="semibold"
        color={palette.alert}
        style={{ flex: 1, fontSize: 16 }}
      >
        {message}
      </Text>
    </View>
  );
}

/** Six visual boxes over one hidden input, so paste and SMS/email autofill still work. */
function CodeBoxes({
  value,
  error,
  onChange,
}: {
  value: string;
  error: boolean;
  onChange: (v: string) => void;
}) {
  const { palette } = useTheme();
  const input = useRef<TextInputInstance>(null);
  return (
    <Pressable
      style={styles.boxes}
      onPress={() => input.current?.focus()}
      accessibilityLabel="Verification code"
    >
      {Array.from({ length: CODE_LENGTH }, (_, i) => {
        const active = !error && i === value.length;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                backgroundColor: error ? palette.tones.alert.bg : palette.surface,
                borderColor: error ? palette.alert : active ? palette.action : palette.hairline,
              },
            ]}
          >
            {value[i] ? (
              <Text variant="title" tabular>
                {value[i]}
              </Text>
            ) : active ? (
              <View style={[styles.caret, { backgroundColor: palette.action }]} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        ref={input}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        autoFocus
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  box: {
    flex: 1,
    height: 72,
    borderRadius: radius.input,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caret: { width: 2, height: 30, borderRadius: 1 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.sm,
  },
  tip: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    marginTop: space.xl,
    paddingVertical: space.lg,
  },
  error: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, alignItems: 'flex-start' },
});
