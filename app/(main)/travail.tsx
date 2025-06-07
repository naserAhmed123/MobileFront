import { MaterialIcons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Task = {
  status: string;
  time: string;
  id: string;
};

const TravailScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [dateTimes, setDateTimes] = useState<Date[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(2);
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

  useEffect(() => {
    const now = new Date();
    const dates = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - 2 + index);
      return date;
    });
    setDateTimes(dates);
  }, []);

  const getMonthAbbr = (date: Date): string => {
    const monthsAbbr = [
      'JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN',
      'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC',
    ];
    return monthsAbbr[date.getMonth()];
  };

  const getDayAbbr = (date: Date): string => {
    const daysAbbr = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return daysAbbr[date.getDay()];
  };

  const showNotification = (message: string): void => {
    Alert.alert('Notification', message);
  };

  const tabs = ['Tout', 'À faire', 'En cours', 'Terminée', 'Vers Direction'];

  const tasks: Task[] = [
    { status: 'À faire', time: '10:00 AM', id: '75698745' },
    { status: 'En cours', time: '12:00 PM', id: '75698746' },
    { status: 'Terminée', time: '9:00 AM', id: '75698747' },
    { status: 'Terminée', time: '9:00 AM', id: '75698747' },
    { status: 'Vers Direction', time: '8:00 AM', id: '75698748' },
  ];

  const filteredTasks = selectedTabIndex === 0
    ? tasks
    : tasks.filter((task) => task.status === tabs[selectedTabIndex]);

  return (
    <LinearGradient
      colors={['#E3F2FD', '#FFFFFF']}
      style={styles.container}
      start={{ x: 0.5, y: 0.5 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MaterialIcons name="menu" size={30} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travail d'aujourd'hui</Text>
          <TouchableOpacity onPress={() => showNotification('Aucune Notification')}>
            <MaterialIcons name="notifications-none" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dateTimes.map((date, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDayIndex(index)}
                style={[
                  styles.dateCard,
                  selectedDayIndex === index && styles.selectedDateCard,
                ]}
              >
                <Text
                  style={[
                    styles.monthText,
                    selectedDayIndex === index && styles.selectedDateText,
                  ]}
                >
                  {getMonthAbbr(date)}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    selectedDayIndex === index && styles.selectedDateText,
                  ]}
                >
                  {date.getDate()}
                </Text>
                <Text
                  style={[
                    styles.dayText,
                    selectedDayIndex === index && styles.selectedDateText,
                  ]}
                >
                  {getDayAbbr(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedTabIndex(index)}
                style={[
                  styles.tabItem,
                  selectedTabIndex === index && styles.selectedTabItem,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTabIndex === index && styles.selectedTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Task List */}
        <View style={styles.taskListContainer}>
          <FlatList
            data={filteredTasks}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.taskCard}>
                <Text style={styles.taskStatus}>{item.status}</Text>
                <Text style={styles.taskId}>Réclamation : {item.id}</Text>
                <View style={styles.taskTime}>
                  <View style={styles.timeIcon}>
                    <MaterialIcons name="access-time" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.taskListContent}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: 'bold',
  },
  dateSelectorContainer: {
    height: 120,
  },
  dateCard: {
    width: 80,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  selectedDateCard: {
    backgroundColor: '#0047AB',
  },
  monthText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginVertical: 4,
  },
  dayText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  tabBarContainer: {
    height: 60,
  },
  tabItem: {
    width: 120,
    height: 50,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedTabItem: {
    backgroundColor: '#0047AB',
  },
  tabText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  taskListContainer: {
    flex: 1,
  },
  taskListContent: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  taskStatus: {
    fontSize: 20,
    color: '#757575',
    fontWeight: '500',
  },
  taskId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default TravailScreen;