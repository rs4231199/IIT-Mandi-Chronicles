import React, { Component } from 'react';
import { View, StyleSheet, Alert, Image, Text } from 'react-native';
import NetInfo from "@react-native-community/netinfo";

import { auth } from '../config';

let userINFO = "";
class LoadingScreen extends Component {
  componentDidMount() {
    NetInfo.isConnected.addEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
  }
  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
  }
 
  _handleConnectivityChange = (isConnected) => {
    if(isConnected == true) {
      this.checkIfLoggedIn();
    }
    else {
      Alert.alert("Internet connection is required!");
    }
  };

  checkIfLoggedIn = () => {
    auth.onAuthStateChanged(
      function(user) {
        userINFO = user;
        if (user) {
          this.props.navigation.navigate('DashboardScreen');
        } else {
          this.props.navigation.navigate('LoginScreen');
        }
      }.bind(this)
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <Image
          style={{width: 120, height: 120, borderWidth: 4, borderColor: 'white', borderRadius: 60 }}
          source={require('../assets/ic_launcher_round.png')}
        />
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22, marginTop: 10 }}>IIT Mandi Chronicles</Text>
        <Text style={{ color: 'white', marginTop: 10, paddingHorizontal: '20%' }}>One place to stay connected with all the events and news of IIT Mandi.</Text>
      </View>
    );
  }
}
export default LoadingScreen;
export { userINFO };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#512DA7'
  }
});
