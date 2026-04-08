import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55; 

export interface SuggestedUser {
  id: string;
  name: string;
  age: number;
  distance: string;
  image: any;
}

interface SuggestionCardProps {
  user: SuggestedUser;
  onPass: () => void;
  onMatch: () => void;
}

export default function SuggestionCard({ user, onPass, onMatch }: SuggestionCardProps) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        
        {/* IMAGE CONTAINTER : Définit l'espace pour l'image */}
        <View style={styles.imageContainer}>
          {/* IMAGE : resizeMode="contain" pour voir toute l'image, centrée par défaut */}
          <Image source={user.image} style={styles.image} resizeMode="contain" />
        </View>

        {/* INFOS + BOUTONS : Partie basse (35%) */}
        <View style={styles.infoSection}>
          <View style={styles.textContainer}>
            <Text style={styles.nameText} numberOfLines={1}>{user.name}, {user.age}</Text>
            <View style={styles.distanceRow}>
              <Ionicons name="location-sharp" size={14} color="#C44A93" />
              <Text style={styles.distanceText}>{user.distance}</Text>
            </View>
          </View>

          {/* Boutons remontés grâce à un padding plus serré */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.passButton]} 
              onPress={onPass}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#8E8291" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.matchButton]} 
              onPress={onMatch}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: CARD_HEIGHT,
    shadowColor: '#2F2632',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden', 
  },
  imageContainer: {
    width: '100%',
    height: '65%', // Espace pour l'image
    backgroundColor: '#F5F5F5', // Fond léger pour voir les bords de l'image si contain
    justifyContent: 'center', // Centre verticalement l'image dans le container
    alignItems: 'center', // Centre horizontalement l'image dans le container
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    flex: 1, 
    paddingHorizontal: 18,
    paddingTop: 12,    // Réduit l'espace en haut des infos
    paddingBottom: 10, // Réduit l'espace en bas des boutons
    justifyContent: 'flex-start', // Aligne tout vers le haut au lieu de séparer
    backgroundColor: '#FFFFFF',
  },
  textContainer: {
    marginBottom: 12, // Petit espace fixe entre texte et boutons
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2F2632',
    marginBottom: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8291',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  actionButton: {
    width: 50, // Un peu plus compact
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F0F5',
    elevation: 2,
  },
  passButton: {
    backgroundColor: '#FFFFFF',
  },
  matchButton: {
    backgroundColor: '#C44A93',
    borderColor: '#C44A93',
  },
});