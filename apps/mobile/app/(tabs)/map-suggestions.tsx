import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, PanResponder } from 'react-native';
import { router } from 'expo-router';
import TopBar from '@/components/TopBar';
import SuggestionCard, { SuggestedUser, CARD_WIDTH } from '@/components/map/SuggestionCard';

const LOGO_IMAGE = require('@/assets/images/logo.png');

const suggestedUsers: SuggestedUser[] = [
  { id: '1', name: 'Sarah', age: 24, distance: '0.5 MILES AWAY', image: LOGO_IMAGE },
  { id: '2', name: 'Marcus', age: 26, distance: '1.2 MILES AWAY', image: LOGO_IMAGE },
];

export default function MapSuggestionsScreen() {
  
  const pullDownResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) { 
          router.navigate('/map'); 
        }
      },
    })
  ).current;

  const renderCard = useCallback(({ item }: { item: SuggestedUser }) => (
    <SuggestionCard
      user={item}
      onPass={() => console.log('Passed on', item.name)}
      onMatch={() => console.log('Matched with', item.name)}
    />
  ), []);

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Home" />

      <View style={styles.content}>
        
        {/* The gesture area now includes the visual handle bar */}
        <View {...pullDownResponder.panHandlers} style={styles.draggableHeader}>
          <View style={styles.handleBar} /> 
          <Text style={styles.headerTitle}>People Minglin' Nearby</Text>
          <Text style={styles.headerSubtitle}>Discover connections just a few steps away.</Text>
        </View>

        <FlatList
          data={suggestedUsers}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={CARD_WIDTH + 16} 
          decelerationRate="fast"
          initialNumToRender={3}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FCF9FC' 
  },
  content: { 
    flex: 1, 
    paddingTop: 10 
  },
  draggableHeader: {
    alignItems: 'center', // Centers the handle bar
    paddingBottom: 20, 
    backgroundColor: 'transparent',
  },
  handleBar: { 
    width: 50, 
    height: 5, 
    borderRadius: 3, 
    backgroundColor: '#E6E1E6', // Light gray handle bar
    marginBottom: 20, // Space between handle and title
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#3B2A3D', 
    paddingHorizontal: 20, 
    marginBottom: 8,
    alignSelf: 'flex-start' // Keeps text aligned left while handle is centered
  },
  headerSubtitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#8E8291', 
    paddingHorizontal: 20,
    alignSelf: 'flex-start'
  },
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
});