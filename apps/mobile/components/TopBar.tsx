import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

type TopBarProps = {
  title?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
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
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.topBar }}>
      <View style={[styles.container, { backgroundColor: colors.topBar }]}>
        <Pressable style={styles.iconButton} onPress={onLeftPress}>
          <Feather name={leftIcon} size={22} color={colors.pink} />
        </Pressable>
        <Text style={[styles.title, { color: colors.pink }]}>{title}</Text>
        <Pressable style={styles.iconButton} onPress={onRightPress}>
          {rightIcon ? <Ionicons name={rightIcon} size={22} color={colors.pink} /> : <View style={{ width: 22 }} />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
    fontStyle: 'italic',
  },
});