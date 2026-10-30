import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

export const INSTITUTIONAL_DOMAINS = [
  '@unan.edu.ni',
  '@est.unan.edu.ni',
  '@doc.unan.edu.ni',
];

export const POPULAR_DOMAINS = [
  '@gmail.com',
  '@outlook.com',
  '@icloud.com',
  '@hotmail.com',
  '@yahoo.com',
];

export const ALL_SUGGESTED_DOMAINS = [
  ...INSTITUTIONAL_DOMAINS,
  ...POPULAR_DOMAINS,
];

interface EmailInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  isRequired?: boolean;
  error?: string;
  showSuggestions?: boolean;
}

export const isValidEmail = (email: string): boolean => {
  const clean = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(clean);
};

export const isInstitutionalEmail = (email: string): boolean => {
  const clean = email.trim().toLowerCase();
  return clean.endsWith('@unan.edu.ni') || clean.endsWith('@est.unan.edu.ni') || clean.endsWith('@doc.unan.edu.ni');
};

export const EmailInput: React.FC<EmailInputProps> = ({
  label = 'Correo institucional o personal',
  value,
  onChangeText,
  isRequired = false,
  error: externalError,
  showSuggestions = true,
  placeholder = 'usuario@unan.edu.ni o usuario@gmail.com',
  style,
  ...props
}) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (rawText: string) => {
    const cleanText = rawText.replace(/\s/g, '').toLowerCase();
    onChangeText(cleanText);
  };

  const typoCorrection = useMemo(() => {
    if (!value || !value.includes('@')) return null;
    const parts = value.split('@');
    if (parts.length < 2) return null;
    const domainPart = '@' + parts[1].toLowerCase();

    if (
      domainPart === '@unan.com' ||
      domainPart === '@unan.edu' ||
      domainPart === '@unan.es' ||
      domainPart === '@unan.org' ||
      domainPart === '@unan.ni'
    ) {
      return {
        suggested: parts[0] + '@unan.edu.ni',
        displayDomain: '@unan.edu.ni',
      };
    }

    if (
      domainPart === '@gmai.com' ||
      domainPart === '@gamil.com' ||
      domainPart === '@gmail.co' ||
      domainPart === '@gmial.com' ||
      domainPart === '@gmaill.com'
    ) {
      return {
        suggested: parts[0] + '@gmail.com',
        displayDomain: '@gmail.com',
      };
    }

    if (
      domainPart === '@outlok.com' ||
      domainPart === '@outloo.com' ||
      domainPart === '@putlook.com'
    ) {
      return {
        suggested: parts[0] + '@outlook.com',
        displayDomain: '@outlook.com',
      };
    }

    if (
      domainPart === '@hotmial.com' ||
      domainPart === '@hotmal.com' ||
      domainPart === '@hormail.com'
    ) {
      return {
        suggested: parts[0] + '@hotmail.com',
        displayDomain: '@hotmail.com',
      };
    }

    if (
      domainPart === '@icluod.com' ||
      domainPart === '@iclud.com'
    ) {
      return {
        suggested: parts[0] + '@icloud.com',
        displayDomain: '@icloud.com',
      };
    }

    if (
      domainPart === '@yaho.com' ||
      domainPart === '@yahooo.com'
    ) {
      return {
        suggested: parts[0] + '@yahoo.com',
        displayDomain: '@yahoo.com',
      };
    }

    return null;
  }, [value]);

  const handleSelectDomain = (domain: string) => {
    if (!value) {
      onChangeText(domain);
      return;
    }
    const atIndex = value.indexOf('@');
    if (atIndex === -1) {
      onChangeText(`${value.trim()}${domain}`);
    } else {
      const username = value.substring(0, atIndex);
      onChangeText(`${username}${domain}`);
    }
  };

  const handleApplyCorrection = () => {
    if (typoCorrection) {
      onChangeText(typoCorrection.suggested);
    }
  };

  const hasInstitutionalDomain = useMemo(() => isInstitutionalEmail(value), [value]);
  const isCompleteValid = useMemo(() => isValidEmail(value), [value]);

  const filteredDomains = useMemo(() => {
    if (!value || !value.includes('@')) {
      return ALL_SUGGESTED_DOMAINS;
    }
    const atIndex = value.lastIndexOf('@');
    const suffix = value.substring(atIndex).toLowerCase();
    if (suffix === '@') {
      return ALL_SUGGESTED_DOMAINS;
    }
    const matches = ALL_SUGGESTED_DOMAINS.filter((d) => d.toLowerCase().startsWith(suffix));
    return matches.length > 0 ? matches : ALL_SUGGESTED_DOMAINS;
  }, [value]);

  const shouldShowSuggestions = useMemo(() => {
    if (!showSuggestions) return false;
    if (!value) return isFocused;
    return isFocused && !isCompleteValid;
  }, [showSuggestions, value, isFocused, isCompleteValid]);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {isRequired && <Text style={{ color: '#EF4444' }}> *</Text>}
          </Text>
          {hasInstitutionalDomain ? (
            <View style={styles.institutionalTag}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Text style={styles.institutionalTagText}>UNAN Verificado</Text>
            </View>
          ) : isCompleteValid ? (
            <View style={styles.personalTag}>
              <CheckCircle2 size={12} color="#2563EB" />
              <Text style={styles.personalTagText}>Válido</Text>
            </View>
          ) : null}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          externalError
            ? styles.inputError
            : hasInstitutionalDomain
            ? styles.inputValidInstitutional
            : isCompleteValid
            ? styles.inputValidPersonal
            : {},
        ]}
      >
        <Mail
          size={18}
          color={
            externalError
              ? '#EF4444'
              : hasInstitutionalDomain
              ? '#16A34A'
              : isCompleteValid
              ? '#2563EB'
              : isFocused
              ? colors.primary
              : colors.textSecondary
          }
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, style]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>

      {typoCorrection && (
        <TouchableOpacity
          style={styles.typoBanner}
          onPress={handleApplyCorrection}
          activeOpacity={0.8}
        >
          <AlertCircle size={14} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={styles.typoText}>
            ¿Quisiste escribir <Text style={styles.typoHighlight}>{typoCorrection.displayDomain}</Text>? Toca para corregir.
          </Text>
        </TouchableOpacity>
      )}

      {shouldShowSuggestions && (
        <View style={styles.suggestionsWrapper}>
          <Text style={styles.suggestionsHeader}>Sugerencias rápidas:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chipsContainer}
          >
            {filteredDomains.map((domain) => {
              const isInst = INSTITUTIONAL_DOMAINS.includes(domain);
              const isActive = value.endsWith(domain);
              return (
                <TouchableOpacity
                  key={domain}
                  style={[
                    styles.chip,
                    isInst && styles.chipInstitutional,
                    isActive && styles.chipActive,
                  ]}
                  onPress={() => handleSelectDomain(domain)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isInst && styles.chipTextInstitutional,
                      isActive && styles.chipTextActive,
                    ]}
                  >
                    {domain}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {externalError ? (
        <Text style={styles.errorText}>{externalError}</Text>
      ) : null}
    </View>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.m,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    label: {
      ...theme.typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    institutionalTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    institutionalTagText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#15803D',
    },
    personalTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DBEAFE',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    personalTagText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#1D4ED8',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: colors.border,
      height: 56,
      paddingHorizontal: theme.spacing.m,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    inputValidInstitutional: {
      borderColor: '#16A34A',
    },
    inputValidPersonal: {
      borderColor: '#3B82F6',
    },
    inputError: {
      borderColor: '#EF4444',
    },
    icon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      height: '100%',
    },
    errorText: {
      color: '#EF4444',
      fontSize: 12,
      marginTop: 4,
      fontWeight: '500',
    },
    typoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 6,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    typoText: {
      fontSize: 12,
      color: '#92400E',
    },
    typoHighlight: {
      fontWeight: 'bold',
      textDecorationLine: 'underline',
      color: '#B45309',
    },
    suggestionsWrapper: {
      marginTop: 8,
    },
    suggestionsHeader: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 4,
    },
    chipsContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipInstitutional: {
      borderColor: '#86EFAC',
      backgroundColor: '#F0FDF4',
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    chipTextInstitutional: {
      color: '#15803D',
      fontWeight: '700',
    },
    chipTextActive: {
      color: '#FFFFFF',
    },
  });
