import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

type TopBarProps = {
  title?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  onRightPress?: () => void;
};

export default function TopBar({
  title = 'Mingle',
  leftIcon = 'settings',
  rightIcon = 'heart-outline',
  onLeftPress,
  onRightPress,
}: TopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.iconButton} onPress={onLeftPress}>
          <Feather name={leftIcon} size={22} color="#C05AA8" />
        </Pressable>

        <Text style={styles.title}>{title}</Text>

        <Pressable style={styles.iconButton} onPress={onRightPress}>
          <Ionicons name={rightIcon} size={22} color="#C05AA8" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FDF1F7',
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#FDF1F7',
  },
  iconButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#C05AA8',
    fontStyle: 'italic',
  },
});