import React, { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '@/components/notification/NotificationContext';

type FeatherIconName = ComponentProps<typeof Feather>['name'];
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
  onLeftPress,
}: TopBarProps) {
  const { isOpen, toggle } = useNotifications();

  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.topBar }}>
      <View style={[styles.container, { backgroundColor: colors.topBar }]}>
        <Pressable style={styles.iconButton} onPress={onLeftPress}>
          <Feather name={leftIcon} size={22} color={colors.pink} />
        </Pressable>

        <Text style={[styles.title, { color: colors.pink }]}>{title}</Text>

        <Pressable style={styles.iconButton} onPress={toggle}>
          <Ionicons
            name={isOpen ? 'heart' : 'heart-outline'}
            size={22}
            color="#C05AA8"
          />
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