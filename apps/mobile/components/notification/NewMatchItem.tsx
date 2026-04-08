import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NewMatch } from './types';

type Props = {
  item: NewMatch;
  onPress?: () => void;
};

export default function NewMatchItem({ item, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.outerRing}>
        <View style={styles.innerRing}>
          <Image source={item.avatar} style={styles.avatar} />
        </View>
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {item.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 74,
    alignItems: 'center',
    marginRight: 14,
  },
  outerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: '#F29B6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    backgroundColor: '#D85AAF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    color: '#47323F',
    textAlign: 'center',
  },
});
