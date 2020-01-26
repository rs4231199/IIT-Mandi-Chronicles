import React from 'react';
import { FlatList, StyleSheet, Text, View, Image, TouchableWithoutFeedback } from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import ViewMoreText from 'react-native-view-more-text';
import * as Calendar from 'expo-calendar';
import * as Permissions from 'expo-permissions'
import { createStackNavigator } from 'react-navigation-stack';
import { AsyncStorage } from 'react-native';
import HyperLink from 'react-native-hyperlink';
import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';

import { firestore } from '../../config';
import { userINFO } from '../LoadingScreen';
import comments from './commentScreen';

const database = firestore;

class mainPost extends React.Component {
  constructor(props){
    super(props);
    this.uid = userINFO.uid;
    this.heart = <FontAwesome name="heart" style={{ fontSize: 30, color: '#FB3958' }}/>;
    this.hearto = <FontAwesome name="heart" style={{ fontSize: 30, color: '#747474' }}/>;
    this.saved = <FontAwesome name="bookmark" style={{ fontSize: 30, color: '#FEC927' }}/>;
    this.unsaved = <FontAwesome name="bookmark" style={{ fontSize: 30, color: '#747474' }}/>;
    this.calendar = {};
    this.state = {
      documentData: [],
      update_like: false,
      saving_to_calendar: false,
    };
  }

  componentDidMount = async () => {
    this._onFocusListener = this.props.navigation.addListener('didFocus', async(payload) => {

      let documentData = [];
      const { status } = Permissions.askAsync(Permissions.CAMERA_ROLL);

      let allKeys = await AsyncStorage.getAllKeys();
      for(let i=0; i<allKeys.length-1; i++) {
        let value = await AsyncStorage.getItem(allKeys[i]);
        documentData.push(JSON.parse(value));
      }

      this.setState({
        documentData : documentData,
        update_like : this.update_like ? false : true,
      });
    });
  }
  componentWillUnmount = () => {
    this._onFocusListener.remove();
  }

  renderViewMore(onPress){
    return(
      <Text onPress={onPress} style={{color: '#6CA4C8', textDecorationLine: 'underline'}}>See More</Text>
    )
  }
  renderViewLess(onPress){
    return(
      <Text onPress={onPress} style={{color: '#6CA4C8', textDecorationLine: 'underline'}}>See Less</Text>
    )
  }

  savePost = async(post) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if(status === 'granted') {
      if(post.saved) {
        post.saved = false;
        await AsyncStorage.removeItem(post.path);
      }
      else {
        post.saved = true;
        await AsyncStorage.setItem(post.path, JSON.stringify(post));
      }
      this.setState({
        update_like : this.update_like ? false : true,
      });
    }
  }

  likeButton = (post) => {
    let likePath = post.path + '/likes';
    if(post.isLiked) {
      post.isLiked = false;
      post.numberOfLikes--;
      database.collection(likePath).doc(this.uid).delete();
    }
    else {
      post.isLiked = true;
      post.numberOfLikes++;
      database.collection(likePath).doc(this.uid).set({});
    }
    this.setState({
      update_like : this.update_like ? false : true,
    });
  }
  async saveToCalendar(post) {
    try {
      const { status } = await Permissions.askAsync(Permissions.CALENDAR);
      if (status === 'granted') {
        this.setState({ saving_to_calendar: true });
        const calendars = await Calendar.getCalendarsAsync();
        for(let i = calendars.length -1; i >= 0 ; i--) {
          if(calendars[i].accessLevel != "owner") {
            calendars.splice(i, 1);
          }
        }
        const calendar = calendars.find(({isPrimary})=>isPrimary);
        if(typeof(calendar) == 'undefined' ) {
          this.calendar = calendars[0];
        }
        else {
          this.calendar = calendar;
        }
        let start_date = new Date(post.miliTime);
        let end_date = new Date(post.miliTime + 3600000);
        Calendar.createEventAsync(
          this.calendar.id,
          {
            title: post.Title,
            startDate: start_date,
            endDate: end_date,
            notes: post.desc,
          }
        );
      }
      setTimeout(() => {
        this.setState({ saving_to_calendar: false });
      }, 2000);
    }
    catch(e) {
      console.log(e);
      setTimeout(() => {
        this.setState({ saving_to_calendar: false });
      }, 2000);
    }
  }
  dateFormatting = (date) => {
    let d = date.split(" ");
    return (d[0] + ' ' + d[2] + '-' + d[1] + '-' + d[3] + ' '  + d[4].slice(0, 5))
  }

  Item = ( post ) => {
    let date = new Date(post.miliTime);
    return (
      <View style={styles.postStyle}>
        <View style={{ height: 4, backgroundColor: '#d7d7d7' }}></View>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Image
            source={{ uri : post.user_image}}
            style={{ width: 56, height: 56, overflow: 'hidden', borderRadius: 28, margin: 5 }} />
          <View style={{ flex: 1, flexDirection: 'column', padding: 2 }}>
            <Text style={{ fontSize: 17, fontWeight: 'bold' }}>Event - { post.Title }</Text>
            <Text style={{ fontSize:13 , color: '#747474' }}>Date & Time : { this.dateFormatting(date.toString()) }</Text>
            <Text style={{ fontSize:13 , color: '#747474' }}>Uploaded by : { post.uploaded_by[2] }</Text>
          </View>
        </View>
        <View style={{ marginLeft: 5, marginRight: 5 }}>
        <HyperLink linkDefault={ true } linkStyle={{ color: '#2980b9', fontSize: 14 }}>
            <ViewMoreText
              numberOfLines={4}
              renderViewMore={this.renderViewMore}
              renderViewLess={this.renderViewLess}
              textStyle={{ fontSize: 14 }}
            >
                <Text>{post.desc}</Text>
            </ViewMoreText>
          </HyperLink>
        </View>
        <View>
          { post.image_url!=null &&
            <Image
              style={{ width: this.screenWidth, height: 350 }}
              source={{uri: post.image_url}} 
              resizeMode='contain' />
          }
        </View>
        <View style={{ marginLeft: 5, marginRight: 5 }}>
          <Text style={{ fontSize:13 , color: '#747474' }}>   {post.numberOfLikes} People like this Event</Text>
          <View
            style={{
              borderBottomColor: '#747474',
              borderBottomWidth: 0.5,
              marginTop: 2,
              marginBottom: 2,
            }}
          />
          <View style={{flex: 1, flexDirection: 'row', marginTop: 2, marginBottom: 5 }}>
            <TouchableWithoutFeedback onPress={() => this.likeButton(post)}>
              <View style={{ marginLeft: 15 }}>
                { post.isLiked ? this.heart : this.hearto }
              </View>
            </TouchableWithoutFeedback>
            <FontAwesome name="bell" style={{ color: '#747474', fontSize: 30, marginLeft: 15 }}
              onPress={() => this.saveToCalendar(post)}
            />
            <TouchableWithoutFeedback onPress={() => this.savePost(post)}>
              <View style={{ marginLeft: 15 }}>
                { post.saved ? this.saved : this.unsaved }
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={() => {
                                        this.props.navigation.navigate('Comment', {
                                          post: post,
                                        });
                                      }}>
              <View style={{ marginLeft: 15 }}>
                <MaterialIcons name="chat" style={{ fontSize: 30, color: 'grey' }}/>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
        <View style={{ height: 4, backgroundColor: '#d7d7d7' }}></View>
      </View>
    );
  }

  render() {
    return (
      <View style={{flex: 1}}>
				{ this.state.saving_to_calendar &&
					<View style={{ width: this.screenWidth, backgroundColor: 'yellow' }}>
						<Text style={{ fontSize: 16, color: 'blue' }}>Adding event to calendar...</Text>
					</View>
				}
        <View style={{ backgroundColor: '#512DA7', height: 45, flexDirection: 'row' }}>
          <Entypo name="menu" style={{ fontSize: 30, color: 'white', marginLeft: 10, marginTop: 8 }} onPress={() => this.props.navigation.dispatch(DrawerActions.toggleDrawer())} />
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 8, marginLeft: 50 }}>Events</Text>
        </View>
        <FlatList
          data={this.state.documentData}
          extraData={this.state}
          renderItem={({ item }) => this.Item(item)}
          keyExtractor={(item, index) => String(index)}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No Saved Events</Text>}
          showsVerticalScrollIndicator={false}
        />
      </View>
    )
  }
}

const posts = createStackNavigator(
  {
    MainPost: mainPost,
    Comment: comments,
  },
  {
    headerMode: 'none',
  }
);

export default posts;

const styles = StyleSheet.create({
  postStyle: {
    borderWidth: 0,
    borderRadius: 4,
  }
})
