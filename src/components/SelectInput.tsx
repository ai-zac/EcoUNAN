import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onSelect: (value: string) => void;
  isRequired?: boolean;
}

export const SelectInput = ({ label, value, options, placeholder = 'Selecciona una opción', onSelect, isRequired }: SelectInputProps) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      
      <TouchableOpacity 
        style={styles.inputContainer} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !value && { color: colors.textSecondary }]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.optionItem, value === item && styles.optionItemSelected]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, value === item && styles.optionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: theme.spacing.m,
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  optionItem: {
    padding: theme.spacing.l,
    backgroundColor: colors.surface,
  },
  optionItemSelected: {
    backgroundColor: colors.primary + '1A', 
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
