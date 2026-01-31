import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

import { colors, gradients } from '../styles/theme';

interface GradientTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  variant?: 'primary' | 'accent';
}

// Simple gradient-like text using the primary color
// For full gradient effect, would need @react-native-masked-view/masked-view
export default function GradientText({ 
  children, 
  style,
  variant = 'primary',
}: GradientTextProps) {
  const textColor = variant === 'accent' ? colors.accent : colors.primary;
  
  return (
    <Text style={[styles.text, { color: textColor }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
  },
});
