import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AstrideAvatar } from './KermaLogo';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

interface AstrideAgentProps {
  message: string;
  animated?: boolean;
}

export function AstrideAgent({ message, animated = true }: AstrideAgentProps) {
  const [displayed, setDisplayed] = useState(animated ? '' : message);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();

    if (!animated) { setDisplayed(message); return; }

    setDisplayed('');
    let i = 0;
    const stripped = message.replace(/<[^>]+>/g, '');
    const interval = setInterval(() => {
      if (i >= stripped.length) { clearInterval(interval); setDisplayed(message); return; }
      setDisplayed(stripped.slice(0, ++i));
    }, 10);
    return () => clearInterval(interval);
  }, [message]);

  // Simple bold parsing
  const renderMessage = () => {
    const parts = displayed.split(/(<b>.*?<\/b>)/g);
    return parts.map((part, i) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return (
          <Text key={i} style={styles.bold}>
            {part.slice(3, -4)}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  return (
    <Animated.View style={[styles.row, { opacity: fadeAnim }]}>
      <View style={styles.avatarWrap}>
        <AstrideAvatar size={38} />
        <View style={styles.onlineDot} />
      </View>
      <View style={styles.bubble}>
        <Text style={styles.agentName}>ASTRIDE · KERMA AI</Text>
        <Text style={styles.message}>{renderMessage()}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
    width: 38,
    height: 38,
    flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
    borderTopRightRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  agentName: {
    fontFamily: Typography.bold,
    fontSize: 9,
    color: Colors.t3,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  message: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 21,
  },
  bold: {
    fontFamily: Typography.semiBold,
    color: Colors.kerma,
  },
});
