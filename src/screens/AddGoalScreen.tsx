// @ts-nocheck
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, SafeAreaView, Platform, StatusBar, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { TextInput, Button, Title, Switch, Text, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoals } from '../contexts/GoalContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';

type Props = StackScreenProps<RootStackParamList, 'AddGoal'>;

const AddGoalScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));

  const { addGoal } = useGoals();

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    setLoading(true);

    try {
      const goalData = {
        title,
        targetDate: targetDate || null,
        isPinned,
      };

      await addGoal(goalData);

      // Navigate back to the home screen
      navigation.navigate('Main', { screen: 'Home' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create goal');
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const openDatePicker = () => {
    // On iOS, we can show the picker inline
    // On Android, we need to use the showDatePicker state
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    }
  };

  const formatDisplayDate = (date: Date) => {
    return format(date, "MMMM d, yyyy");
  };
  
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const toggleCalendar = () => {
    if (Platform.OS === 'ios') {
      setShowIOSDatePicker(!showIOSDatePicker);
    } else {
      setShowDatePicker(!showDatePicker);
    }
  };

  return (
    <LinearGradient
      colors={['#F0F4FF', '#E6EEFF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
          <Surface style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <FontAwesome5 name="bullseye" size={30} color="#FF5F5F" style={styles.icon} />
              <Title style={styles.title}>New Goal</Title>
            </View>

            <TextInput
              label="Goal Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="What do you want to achieve?"
              outlineColor="#D0D0D0"
              activeOutlineColor="#35CAFC"
              theme={{ roundness: 16 }}
            />

            <View style={styles.datePickerContainer}>
              <Text style={styles.labelText}>Target Date (Optional)</Text>
              
              <Animated.View style={[
                styles.dateButtonContainer,
                { transform: [{ scale: buttonScale }] }
              ]}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={openDatePicker}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                >
                  <View style={styles.dateButtonContent}>
                    <View style={styles.calendarIconContainer}>
                      <LinearGradient
                        colors={['#35CAFC', '#2D9BF0']}
                        style={styles.calendarGradient}
                      >
                        <FontAwesome5 name="calendar-alt" size={18} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.dateTextContainer}>
                      {targetDate ? (
                        <>
                          <Text style={styles.dateLabel}>Target Date:</Text>
                          <Text style={styles.selectedDateText}>
                            {formatDisplayDate(targetDate)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.placeholderDateText}>
                          Select a target date
                        </Text>
                      )}
                    </View>
                    
                    <TouchableOpacity 
                      onPress={toggleCalendar}
                      style={styles.arrowButton}
                    >
                      <FontAwesome5 
                        name={(Platform.OS === 'ios' && showIOSDatePicker) || (Platform.OS === 'android' && showDatePicker) ? "chevron-down" : "chevron-right"} 
                        size={16} 
                        color="#BBBBBB" 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* For iOS, show the date picker only when showIOSDatePicker is true */}
              {Platform.OS === 'ios' && showIOSDatePicker && (
                <DateTimePicker
                  value={targetDate || new Date()}
                  mode="date"
                  display="inline"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={styles.iosDatePicker}
                />
              )}

              {/* For Android, show the date picker as a modal when showDatePicker is true */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={targetDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <FontAwesome5 name="thumbtack" size={16} color="#FF5F5F" style={styles.pinIcon} />
                <Text style={styles.switchText}>Pin to top of list</Text>
              </View>
              <Switch
                value={isPinned}
                onValueChange={setIsPinned}
                color="#35CAFC"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: '#35CAFC' }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    Create Goal
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={{ color: '#FF5F5F', fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  formContainer: {
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  labelText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333333',
    fontWeight: '500',
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  dateButtonContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  calendarIconContainer: {
    marginRight: 14,
  },
  calendarGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  placeholderDateText: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
  },
  switchTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 10,
  },
  switchText: {
    fontSize: 16,
    color: '#333333',
  },
  buttonContainer: {
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: '#FF5F5F',
    borderWidth: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosDatePicker: {
    marginTop: 12,
    height: 320,
    width: '100%',
  },
  arrowButton: {
    padding: 10,
  },
});

export default AddGoalScreen;