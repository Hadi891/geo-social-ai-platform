import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AssistantHeaderProps = {
  title: string;
  subtitle: string;
};

export default function AssistantHeader({
  title,
  subtitle,
}: AssistantHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="robot-happy-outline"
          size={28}
          color="#B33A90"
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: '#D45C91',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7FB',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D1F2A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#7D6879',
  },
});