import React, { memo } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.75;

export interface SuggestedUser {
  id: string;
  name: string;
  age: number;
  distance: string;
  image: ImageSourcePropType;
}

interface SuggestionCardProps {
  user: SuggestedUser;
  onPass: () => void;
  onMatch: () => void;
}

const SuggestionCard = memo(({ user, onPass, onMatch }: SuggestionCardProps) => {
  return (
    <View style={styles.cardContainer}>
      <ImageBackground
        source={user.image}
        style={styles.cardImage}
        imageStyle={styles.cardImageRadius}
      >
        <View style={styles.cardInfoBox}>
          <Text style={styles.cardName}>
            {user.name}, {user.age}
          </Text>
          <Text style={styles.cardDistance}>{user.distance}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.passButton} onPress={onPass}>
              <Ionicons name="close" size={20} color="#C44A93" />
              <Text style={styles.passText}>PASS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.matchButton} onPress={onMatch}>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
              <Text style={styles.matchText}>MATCH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
});

export default SuggestionCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: '90%',
    marginRight: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardImageRadius: { borderRadius: 24 },
  cardInfoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 16,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2632',
    marginBottom: 4,
  },
  cardDistance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8291',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  passButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EFE7EC',
  },
  passText: { color: '#C44A93', fontWeight: '700', marginLeft: 6, fontSize: 14 },
  matchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8647C',
    paddingVertical: 12,
    borderRadius: 30,
  },
  matchText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 6, fontSize: 14 },
});