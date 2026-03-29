import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ProfileHeaderCardProps = {
  imageSource: ImageSourcePropType;
  matches: number;
  friends: number;
  intrusionScore: number;
};

const formatCount = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
};

export default function ProfileHeaderCard(props: ProfileHeaderCardProps) {
  const { imageSource, matches, friends, intrusionScore } = props;

  return (
    <View style={styles.card}>
      <Image source={imageSource} style={styles.image} resizeMode="cover" />

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCount(matches)}</Text>
          <Text style={styles.statLabel}>MATCHES</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCount(friends)}</Text>
          <Text style={styles.statLabel}>FRIENDS</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{intrusionScore}%</Text>
          <Text style={styles.statLabel}>INTRUSION</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 320,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E8D3E7',
    marginBottom: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,

  },
  image: {
    width: '100%',
    height: '100%',
  },
  statsBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C2430',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A7D89',
    marginTop: 2,
    letterSpacing: 0.6,
  },
});