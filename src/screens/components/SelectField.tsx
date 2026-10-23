import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';

export type SelectOption = { label: string; value: string };

type Props = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  title?: string;
};

// Native Android Picker dialogs can render blank on some physical devices,
// so this modal + list based dropdown is used instead for reliable rendering.
export default function SelectField({ selectedValue, onValueChange, options, placeholder = 'Select an option', title }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const selectedOption = options.find((option) => option.value === selectedValue);

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setIsVisible(true)}>
        <Text style={[styles.fieldText, !selectedOption && styles.placeholderText]} numberOfLines={1}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={18} color="#797979" />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={() => setIsVisible(false)}>
        <View style={styles.overlay}>
          {/* <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={() => setIsVisible(false)} /> */}
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title || placeholder}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <X color="#797979" size={22} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      onValueChange(item.value);
                      setIsVisible(false);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item.label}</Text>
                    {isSelected && <Check size={18} color="#165DFC" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fieldText: {
    flex: 1,
    fontSize: 14,
    color: '#363535',
    fontFamily: 'Poppins-Regular',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // overlayTouchable: {
  //   ...StyleSheet.absoluteFillObject,
  // },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    color: '#363535',
    fontFamily: 'Poppins-Bold',
  },
  list: {
    paddingHorizontal: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 14,
    color: '#363535',
    fontFamily: 'Poppins-Regular',
  },
  optionTextSelected: {
    color: '#165DFC',
    fontFamily: 'Poppins-SemiBold',
  },
});
