import React, { memo } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, DimensionValue } from 'react-native';

export interface MapUser {
  id: string;
  name: string;
  avatarSource: ImageSourcePropType;
  topPercent: DimensionValue; // Updated to DimensionValue
  leftPercent?: DimensionValue; // Updated to DimensionValue
  rightPercent?: DimensionValue; // Updated to DimensionValue
}

interface AvatarPinProps {
  user: MapUser;
}

const AvatarPin = memo(({ user }: AvatarPinProps) => {
  return (
    <View
      style={[
        styles.pinContainer,
        {
          top: user.topPercent,
          left: user.leftPercent,
          right: user.rightPercent,
        },
      ]}
    >
      <Image source={user.avatarSource} style={styles.avatarImage} />
      <View style={styles.pinTail} />
    </View>
  );
});

export default AvatarPin;

const styles = StyleSheet.create({
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -3,
  },
});