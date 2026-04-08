import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  onSelect: (option: string | null) => void;
  currentSelections: string[];
}

export default function FilterModal({ 
  isVisible, 
  onClose, 
  title, 
  options, 
  onSelect,
  currentSelections 
}: FilterModalProps) {
  
  const hasSelection = currentSelections.length > 0;
  // Détection automatique du mode : Distance = Unique, le reste = Multiple
  const isMultiSelect = title !== 'Within 5km';

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons 
                  name={isMultiSelect ? "checkmark-done-circle" : "close-circle"} 
                  size={32} 
                  color={isMultiSelect ? "#C44A93" : "#E6E1E6"} 
                />
              </TouchableOpacity>
            </View>

            {hasSelection && (
              <TouchableOpacity style={styles.clearActionButton} onPress={() => onSelect(null)}>
                <Ionicons name="refresh-circle-outline" size={22} color="#C44A93" />
                <Text style={styles.clearActionText}>Reset filter</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentSelections.includes(item);
                return (
                  <TouchableOpacity 
                    style={styles.optionItem} 
                    onPress={() => {
                      onSelect(item);
                      if (!isMultiSelect) onClose(); // Ferme auto si unique (distance)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    
                    {isMultiSelect ? (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                    ) : (
                      isSelected && <Ionicons name="checkmark-circle" size={24} color="#C44A93" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(47, 38, 50, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 30, padding: 24, elevation: 10, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '800', color: '#2F2632' },
  clearActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCF9FC', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EFE7EC' },
  clearActionText: { marginLeft: 8, fontSize: 14, fontWeight: '700', color: '#C44A93' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#3B2A3D' },
  optionTextSelected: { color: '#C44A93', fontWeight: '800' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#EFE7EC', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#C44A93', borderColor: '#C44A93' }
});