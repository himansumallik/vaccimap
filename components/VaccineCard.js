import React from 'react';
// --- THIS IS THE FIX: Added 'View' to the import ---
import { StyleSheet, View } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';

// This is the new component your Dashboard needs.
// Place this file in: VacciMap/components/VaccineCard.js

export default function VaccineCard({ vaccine, date }) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Avatar.Icon 
          icon="needle" 
          size={40} 
          style={styles.icon}
          color="#0284c7"
        />
        {/* This <View> component will now work */}
        <View style={styles.textContainer}>
          <Text style={styles.vaccineName}>{vaccine}</Text>
          <Text style={styles.dateText}>Due: {date}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    backgroundColor: '#e0f2fe', // Light blue
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e', // Darker blue
  },
  dateText: {
    fontSize: 14,
    color: '#475569',
  },
});

