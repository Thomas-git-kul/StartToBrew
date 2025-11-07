import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BeerCardProps {
  image: any; // for both uri and require format
  name: string;
  rating: number;
  reviews: number;
  description: string;
  onPress?: () => void;
}

const BeerCard: React.FC<BeerCardProps> = ({ image, name, rating, reviews, description, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image 
        source={image} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#d97706" />
          <Text style={styles.ratingText}>
            {rating}/5 rating ({reviews} reviews)
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 60,
    height: 100,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7b3f00', // bruine tint
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#555',
  },
  description: {
    fontSize: 13,
    color: '#444',
  },
});

export default BeerCard;
