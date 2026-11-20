import { useEffect, useState } from 'react';
import { Keyboard, LayoutAnimation, Platform, type KeyboardEvent } from 'react-native';

/**
 * The on-screen keyboard's height (0 when hidden). Layout changes made in response animate on
 * the keyboard's own curve and duration, so content rises with the keyboard instead of
 * trailing it.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const follow = (next: number) => (e: KeyboardEvent) => {
      if (ios && e.duration) {
        LayoutAnimation.configureNext({
          duration: e.duration,
          update: { type: LayoutAnimation.Types.keyboard },
        });
      }
      setHeight(next === 0 ? 0 : e.endCoordinates.height);
    };
    const subs = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', follow(1)),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', follow(0)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);
  return height;
}
