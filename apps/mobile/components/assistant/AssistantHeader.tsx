import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function AssistantHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.pinkBg, borderColor: colors.pink }]}>
        <MaterialCommunityIcons name="robot-happy-outline" size={28} color={colors.pink} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { alignItems: 'center' },
  iconCircle: { width: 74, height: 74, borderRadius: 37, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title:      { fontSize: 28, fontWeight: '700' },
  subtitle:   { marginTop: 4, fontSize: 14 },
});