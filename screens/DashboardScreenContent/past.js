import React from 'react';
import { FlatList, StyleSheet, Text, View, Image, TouchableWithoutFeedback, Dimensions, ActivityIndicator, AsyncStorage, ScrollView } from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import ViewMoreText from 'react-native-view-more-text';
import * as Calendar from 'expo-calendar';
import * as Permissions from 'expo-permissions';
import SkeletonContent from "react-native-skeleton-content";
import { createStackNavigator } from 'react-navigation-stack';
import HyperLink from 'react-native-hyperlink';
import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { UIActivityIndicator } from 'react-native-indicators';

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
    this.screenWidth = (Dimensions.get('window').width);
    this.state = {
      documentData: [],
      limit: 5,
      lastVisible: null,
      loading: false,
      refreshing: false,
      update_like: false,
      saving_to_calendar: false,
    };
  }

  componentDidMount = async () => {
    try {
      this.retrieveData()
    }
    catch (error) {
      // console.log(error);
    }
    this._onFocusListener = this.props.navigation.addListener('didFocus', async(payload) => {
      let documentData = this.state.documentData;
      for(let j=0; j<documentData.length; j++) {
        documentData[j].saved = false;
      }
      let allKeys = await AsyncStorage.getAllKeys();
      for(let i=0; i<allKeys.length-1; i++) {
        for(let j=0; j<documentData.length; j++) {
          if(documentData[j].path == allKeys[i]) {
            documentData[j].saved = true;
          }
        }
      }
      this.setState({
        update_like : this.update_like ? false : true,
        documentData: documentData,
      });
    });
  }

  componentWillUnmount = () => {
    this._onFocusListener.remove();
  }

  retrieveData = async () => {
    try {
      // console.log('Retrieving Data');
      this.setState({ loading: true });
      let date = new Date();
      let date2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      let finalDateInMilliseconds = date2.getTime();
      let initialQuery = await database.collection('Posts')
        .where('miliTime', '<', finalDateInMilliseconds)
        .orderBy('miliTime')
        .limit(this.state.limit)
      let documentSnapshots = await initialQuery.get();
      let documentData = documentSnapshots.docs.map(document => Object.assign(document.data(), {"path": document.ref.path}));

      for(let i=0; i<documentData.length; i++) {
        let likePath = documentData[i].path + "/likes";
        let likeQuery = await database.collection(likePath);
        let likeDocumentSnapshots = await likeQuery.get();
        let likeDocumentData = likeDocumentSnapshots.docs.map(document => Object.assign(document.data(), {"uid_path": document.ref.path}));
        let isLiked = false, numberOfLikes = likeDocumentData.length;
        let uid = likePath + "/" + this.uid;
        for(let j=0; j<numberOfLikes; j++) {
          if(uid == likeDocumentData[j].uid_path)
            isLiked = true;
        }
        documentData[i] = Object.assign({"isLiked": isLiked}, documentData[i]);
        documentData[i] = Object.assign({"numberOfLikes": numberOfLikes}, documentData[i]);
        documentData[i] = Object.assign({"saved": false}, documentData[i]);
      }

      let allKeys = await AsyncStorage.getAllKeys();
      for(let i=0; i<allKeys.length-1; i++) {
        let checkPath = allKeys[i];
        for(let j=0; j<documentData.length; j++) {
          if(documentData[j].path == checkPath) {
            documentData[j].saved = true;
            await AsyncStorage.removeItem(checkPath);
            await AsyncStorage.setItem(checkPath, JSON.stringify(documentData[j]));
          }
        }
      }

      let lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      if(documentData.length) {
        this.setState({
          documentData: documentData,
          lastVisible: lastVisible,
          loading: false,
          refreshing: false,
        });
      }
      else {
        this.setState({
          loading: false,
          refreshing: false,
        });
      }
    }
    catch (error) {
      // console.log(error);
    }
  };

  retrieveMore = async () => {
    try {
      if (this.state.refreshing) return null;
      this.setState({ refreshing: true });
      let date = new Date();
      let date2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      let finalDateInMilliseconds = date2.getTime();
      let additionalQuery = await database.collection('Posts')
        .where('miliTime', '<', finalDateInMilliseconds)
        .orderBy('miliTime')
        .startAfter(this.state.lastVisible)
        .limit(this.state.limit)
      let documentSnapshots = await additionalQuery.get();
      let documentData = documentSnapshots.docs.map(document => Object.assign(document.data(), {"path": document.ref.path}));

      for(let i=0; i<documentData.length; i++) {
        let likePath = documentData[i].path + "/likes";
        let likeQuery = await database.collection(likePath);
        let likeDocumentSnapshots = await likeQuery.get();
        let likeDocumentData = likeDocumentSnapshots.docs.map(document => Object.assign(document.data(), {"uid_path": document.ref.path}));
        let isLiked = false, numberOfLikes = likeDocumentData.length;
        let uid = likePath + "/" + this.uid;
        for(let j=0; j<numberOfLikes; j++) {
          if(uid == likeDocumentData[j].uid_path)
            isLiked = true;
        }
        documentData[i] = Object.assign({"isLiked": isLiked}, documentData[i]);
        documentData[i] = Object.assign({"numberOfLikes": numberOfLikes}, documentData[i]);
        documentData[i] = Object.assign({"saved": false}, documentData[i]);
      }

      let allKeys = await AsyncStorage.getAllKeys();
      for(let i=0; i<allKeys.length-1; i++) {
        let checkPath = allKeys[i];
        for(let j=0; j<documentData.length; j++) {
          if(documentData[j].path == checkPath) {
            documentData[j].saved = true;
            await AsyncStorage.removeItem(checkPath);
            await AsyncStorage.setItem(checkPath, JSON.stringify(documentData[j]));
          }
        }
      }

      let lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      this.setState({
        documentData: [...this.state.documentData, ...documentData],
        lastVisible: lastVisible,
        refreshing: false,
      });
    }
    catch (error) {
      // console.log(error);
      this.setState({ refreshing: false });
    }
  };

  handleRefresh = () => {
    this.setState({
      loading: true,
    }, () => {
      try {
        this.retrieveData();
      }
      catch (error) {
        // console.log(error);
      }
    });
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
      let index = this.state.documentData.indexOf(post);
      let documentData = this.state.documentData;
      if(post.saved) {
        post.saved = false;
        documentData[index].saved = false;
        this.setState({
          documentData: documentData,
        });
        await AsyncStorage.removeItem(post.path);
        // console.log("UNSAVED!!!");
      }
      else {
        post.saved = true;
        documentData[index].saved = true;
        this.setState({
          documentData: documentData,
        });
        await AsyncStorage.setItem(post.path, JSON.stringify(post));
        // console.log("SAVED!!!");
      }
    }
  }
  likeButton = (post) => {
    // console.log("like button pressed");
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
        console.log({calendar});
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
        <View style={{ alignItems: "center" }}>
          { post.image_url!=null &&
            <Image
              style={{ width: this.screenWidth, height: post.image_height*(this.screenWidth)/post.image_width }}
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
      <View style={{ flex: 1 }}>
				{ this.state.saving_to_calendar &&
					<View style={{ width: this.screenWidth, backgroundColor: 'yellow' }}>
						<Text style={{ fontSize: 16, color: 'blue' }}>Adding event to calendar...</Text>
					</View>
				}
        <View style={{ backgroundColor: '#512DA7', height: 45, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Entypo name="menu" style={{ fontSize: 30, color: 'white', marginLeft: 10, marginTop: 8 }} onPress={() => this.props.navigation.dispatch(DrawerActions.toggleDrawer())} />
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>Events                     </Text>
          { !this.state.loading &&
            <FontAwesome name="refresh" style={{ fontSize: 28, color: 'white', marginRight: 15, marginTop: 8 }} onPress={() => this.handleRefresh()}/>
          }
          { this.state.loading &&
            <ActivityIndicator style={{ marginRight: 15, marginTop: 2 }} size="large" color="white" />
          }
        </View>
        { 
          !this.state.loading
          &&
          <FlatList
            data={this.state.documentData}
            extraData={this.state}
            renderItem={({ item }) => this.Item(item)}
            keyExtractor={(item, index) => String(index)}
            onEndReached={() => this.retrieveMore()}
            onEndReachedThreshold={0.5}
            onRefresh={() => this.handleRefresh()}
            refreshing={this.state.loading}
            ListEmptyComponent={<Text style={{textAlign: 'center', marginBottom: 300 }}>No Past Events</Text>}
            ListFooterComponent={this._renderFooter}
          />
        }
        <ScrollView>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth, flexDirection: 'row'}}
            isLoading={this.state.loading}
            layout={[
              { width: 60, height: 60, borderRadius: 30, marginBottom: 6, marginTop: 6, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-100, height: 50, marginBottom: 6, marginTop: 12, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth }}
            isLoading={this.state.loading}
            layout={[
              { width: this.screenWidth-20, height: 70, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-20, height: 290, marginBottom: 3, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-40, height: 5, marginBottom: 3, marginLeft: 20, marginRight: 40 },
              { width: this.screenWidth-20, height: 2, marginBottom: 3, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth, flexDirection: 'row'}}
            isLoading={this.state.loading}
            layout={[
              { width: 40, height: 30, marginBottom: 6, marginLeft: 20, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth, flexDirection: 'row'}}
            isLoading={this.state.loading}
            layout={[
              { width: 60, height: 60, borderRadius: 30, marginBottom: 6, marginTop: 6, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-100, height: 50, marginBottom: 6, marginTop: 12, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth }}
            isLoading={this.state.loading}
            layout={[
              { width: this.screenWidth-20, height: 70, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-20, height: 290, marginBottom: 3, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-40, height: 5, marginBottom: 3, marginLeft: 20, marginRight: 40 },
              { width: this.screenWidth-20, height: 2, marginBottom: 3, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth, flexDirection: 'row'}}
            isLoading={this.state.loading}
            layout={[
              { width: 40, height: 30, marginBottom: 6, marginLeft: 20, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth, flexDirection: 'row'}}
            isLoading={this.state.loading}
            layout={[
              { width: 60, height: 60, borderRadius: 30, marginBottom: 6, marginTop: 6, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-100, height: 50, marginBottom: 6, marginTop: 12, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth }}
            isLoading={this.state.loading}
            layout={[
              { width: this.screenWidth-20, height: 70, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-20, height: 290, marginBottom: 3, marginLeft: 10, marginRight: 10 },
              { width: this.screenWidth-40, height: 5, marginBottom: 3, marginLeft: 20, marginRight: 40 },
              { width: this.screenWidth-20, height: 2, marginBottom: 3, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
          <SkeletonContent
            containerStyle={{ width: this.screenWidth, flexDirection: 'row'}}
            isLoading={this.state.loading}
            layout={[
              { width: 40, height: 30, marginBottom: 6, marginLeft: 20, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
              { width: 40, height: 30, marginBottom: 6, marginLeft: 10, marginRight: 10 },
            ]}
          >
          </SkeletonContent>
        </ScrollView>
      </View>
    )
  }
  _renderFooter = () => {
    if (!this.state.refreshing) return null;
    return (
      <View
        style={{
          position: 'relative',
          paddingVertical: 20,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <UIActivityIndicator/>
      </View>
    );
  };
}

const past = createStackNavigator(
  {
    MainPost: mainPost,
    Comment: comments,
  },
  {
    headerMode: 'none',
  }
);

past.navigationOptions = ({ navigation }) => {
  let tabBarVisible = true;
  if (navigation.state.index > 0) {
    tabBarVisible = false;
  }

  return {
    tabBarVisible,
  };
};

export default past;

const styles = StyleSheet.create({
  postStyle: {
    borderWidth: 0,
    borderRadius: 4,
  }
})
