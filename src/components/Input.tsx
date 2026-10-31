import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  isPassword?: boolean;
  isRequired?: boolean;
  error?: string;
  success?: string;
}

export const Input = ({ label, isPassword, isRequired, error, success, style, ...props }: InputProps) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const [secureText, setSecureText] = React.useState(isPassword);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      <View style={[styles.inputContainer, error ? { borderColor: '#EF4444' } : success ? { borderColor: '#10B981' } : {}]}>
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={secureText}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.showButton}>
            {secureText ? (
              <Eye size={20} color={colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : success ? (
        <Text style={styles.successText}>{success}</Text>
      ) : null}
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  successText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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
});
