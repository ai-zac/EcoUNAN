import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
}

export const Input = ({ label, isPassword, style, ...props }: InputProps) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const [secureText, setSecureText] = React.useState(isPassword);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={secureText}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.showButton}>
            <Text style={styles.showText}>{secureText ? 'Mostrar' : 'Ocultar'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.m,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  showButton: {
    paddingHorizontal: theme.spacing.m,
    justifyContent: 'center',
    height: '100%',
  },
  showText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
