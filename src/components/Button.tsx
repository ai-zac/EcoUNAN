import React, { useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, ViewStyle, TextStyle, PressableProps, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button = ({
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  onPress,
  ...props
}: ButtonProps) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: 0.92,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
    props.onPressOut?.(e);
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.surface;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    if (variant === 'primary') return '#FFFFFF';
    return colors.primary;
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      {...props}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: theme.colors.border,
            transform: [{ scale }]
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <>
            {icon && <React.Fragment>{icon}</React.Fragment>}
            <Text
              style={[
                styles.text,
                { color: getTextColor(), marginLeft: icon ? theme.spacing.s : 0 },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  container: {
    height: 56,
    borderRadius: theme.borderRadius.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.l,
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
