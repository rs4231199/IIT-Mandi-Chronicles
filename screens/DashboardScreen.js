import React, { Component } from 'react';
import { Alert, View, SafeAreaView, Text, StyleSheet, Image, TouchableOpacity, Linking, Share } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { createDrawerNavigator, DrawerItems } from 'react-navigation-drawer';
import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';

import { fbase, firestore } from '../config';
import today from './DashboardScreenContent/today';
import upcoming from './DashboardScreenContent/upcoming';
import past from './DashboardScreenContent/past';
import posts from './DashboardScreenContent/Saved_posts';
import { userINFO } from './LoadingScreen';
import createEvent from './DashboardScreenContent/createEvent';

const MainStack = createBottomTabNavigator(
  {
    Past: {screen: past,
      navigationOptions: {
        tabBarLabel:'Past',
        tabBarIcon:({ tintColor }) => (
          <MaterialIcons name="date-range" style={{fontSize: 25, color: tintColor}}/>
        )
      }
    },
    Today: {screen: today,
      navigationOptions: {
        tabBarLabel:'Today',
        tabBarIcon:({ tintColor }) => (
          <MaterialIcons name="date-range" style={{fontSize: 25, color: tintColor}}/>
        )
      }
    },
    Upcoming: {screen: upcoming,
      navigationOptions: {
        tabBarLabel:'Upcoming',
        tabBarIcon:({ tintColor }) => (
          <MaterialIcons name="date-range" style={{fontSize: 25, color: tintColor}}/>
        )
      }
    }
  },
  {
    initialRouteName: "Today",
    tabBarOptions: {
      activeTintColor: '#512DA7',
      style:{ height: 45 },
      style: {
        backgroundColor: '#e3e1e1'
      }
    }
  }
);

const showAlert = () =>{
  Alert.alert(
    '',
    'Are you sure you want to logout?',
    [
      {
        text: 'NO',
        onPress: () => console.log('NO Pressed'),
        style: 'cancel',
      },
      {text: 'YES', onPress: () => fbase.auth().signOut()},
    ],
    {cancelable: false},
  );
}

onShare = async () => {
  try {
    const result = await Share.share({
      message:
        'React Native | A framework for building native apps using React',
    });
  } catch (error) {
    // console.log(error.message);
  }
};

let updateMessage = '';
const CustomDrawerContentComponent = props => (
  <SafeAreaView
    style={styles.container}
    forceInset={{ top: 'always', horizontal: 'never' }}
  >
    <View style={{ backgroundColor: '#3be3d8' }}>
      {
        updateMessage!='' &&
        <Text style={{ color: '#701485' }}> {updateMessage} </Text>
      }
    </View>
    <View style={{ backgroundColor: '#333333', paddingTop: 60, paddingLeft: 16, paddingBottom: 16, paddingRight: 16, }}>
      <Image
        style={{width: 66, height: 66, borderRadius: 33, borderColor: 'white', borderWidth: 1 }}
        source={{uri: userINFO.photoURL}}
      />
      <View style={{ flexDirection: 'row' }}>
        <View style={{flex: 1, flexDirection: 'column' }}>
          <Text style={{ fontWeight: 'bold', color: '#fafafa', marginTop: 5 }}> { userINFO.displayName } </Text>
          <Text style={{ color: '#dcdcdc', marginTop: 1 }}> { userINFO.email } </Text>
        </View>
        <FontAwesome name="power-off" style={{ fontSize: 30, color: 'white' }} onPress={showAlert}/>
      </View>
    </View>
    <View>
      <DrawerItems
        activeBackgroundColor={"#DCDCDC"}
        activeTintColor={"#673ABA"}
        {...props}
      />
    </View>
    <TouchableOpacity onPress={() => Linking.openURL('https://iitmandi.co.in/IITMandiChronicles/privacy-policy.html')}>
      <View style={{ flexDirection: 'row', height: 45, paddingLeft: 18, paddingTop: 10 }}>
        <MaterialIcons name="security" style={{ fontSize: 18, color: '#747474' }}/>
        <Text style={{ marginLeft: 32, fontWeight: 'bold'}}> Privacy Policy</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => Share.share({
        message:'Let me recommend you this application\n\nhttps://play.google.com/store/apps/details?id=com.paresh.alert ',
      })}>
      <View style={{ flexDirection: 'row', height: 45, paddingLeft: 18, paddingTop: 10 }}>
          <Entypo name="share" style={{ fontSize: 18, color: '#747474' }}/>
          <Text style={{ marginLeft: 32, fontWeight: 'bold'}}> Share </Text>
      </View>
    </TouchableOpacity>
  </SafeAreaView>
);

const MyDrawerNavigation = createAppContainer(createDrawerNavigator(
{
  "Events": {
    screen: MainStack,
    navigationOptions: {
      drawerIcon: ({ tintColor }) => ( <MaterialIcons name="date-range" style={{fontSize: 18, color: tintColor}}/>)
    }
   },
  "Saved Events": {
    screen: posts,
    navigationOptions: {
      drawerIcon: ({ tintColor }) => ( <FontAwesome name="bookmark" style={{fontSize: 18, color: tintColor}}/>)
    }
   },
   "Create New Event": {
    screen: createEvent,
    navigationOptions: {
      drawerIcon: ({ tintColor }) => ( <MaterialIcons name="create" style={{fontSize: 18, color: tintColor}}/>)
    }
  }
},
{
  contentComponent: CustomDrawerContentComponent
}
));

class DashboardScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
    }
  }
  componentDidMount = async() => {
    let initialQuery = await firestore.collection('updateMessage');
    let documentSnapshots = await initialQuery.get();
    const documentData = documentSnapshots.docs.map(document => document.data());
    updateMessage = documentData[0].content;
    this.setState({ message: updateMessage });
  }

  render() {
    return (
      <MyDrawerNavigation/>
    );
  }
}
export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
