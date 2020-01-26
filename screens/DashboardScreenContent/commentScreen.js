import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View, Image, Keyboard, TouchableOpacity, TouchableWithoutFeedback, TextInput, Platform, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import SkeletonContent from "react-native-skeleton-content";
import Hyperlink from 'react-native-hyperlink';
import { ScrollView } from 'react-native-gesture-handler';
import { Entypo, FontAwesome } from '@expo/vector-icons';

import { firestore } from '../../config';
import { userINFO } from '../LoadingScreen';

const database = firestore;

class comments extends React.Component {
  constructor(props){
    super(props);
    this.uname = userINFO.displayName;
    this.uemail = userINFO.email;
    this.screenWidth = Dimensions.get('window').width;
    this.screenHeight = Dimensions.get('window').height;
    this.state = {
      documentData: [],
      post: this.props.navigation.getParam('post'),
      text: '',
      loading: true,
      bottomMargin: 0,
    };
  }
  componentDidMount = async() => {
    // console.log(userINFO);
    
    this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {
      try {
        this.retrieveComments();
      }
      catch (error) {
        // console.log(error);
      }
    });
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }
  componentWillUnmount = () => {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }
  _keyboardDidShow = (e) => {
    // console.log('Keyboard Shown==>', e.endCoordinates.height);
    this.setState({
      bottomMargin: e.endCoordinates.height
    });
  }
  _keyboardDidHide = () => {
    // console.log('Keyboard Hidden');
    this.setState({
      bottomMargin: 0
    });
  }
  retrieveComments = async () => {
    try {
      // console.log("Retrieving Comments");
      this.setState({ loading: true });
      let commentPath = this.state.post.path + '/comments';
      let initialQuery = await database.collection(commentPath).orderBy('time');
      let documentSnapshots = await initialQuery.get();
      let documentData = documentSnapshots.docs.map(document => Object.assign(document.data(), {"path": document.ref.path}));

      this.setState({
        documentData: documentData,
        loading: false,
      });
    }
    catch(error) {
      // console.log(error);
    }
  }
  handleRefresh = () => {
    try {
      this.retrieveComments();
    }
    catch (error) {
      // console.log(error);
    }
  }
  dateFormatting = (date) => {
    let d = date.split(" ");
    return (d[0] + ' ' + d[2] + '-' + d[1] + '-' + d[3] + ' '  + d[4].slice(0, 5))
  }
  dateFormatting2 = (date) => {
    let d = date.split(" ");
    return ( d[2] + '-' + d[1] + '-' + d[3] + ' '  + d[4].slice(0, 5))
  }
  submitComment = () => {
    try {
      // console.log("submitting comment...");
      let commentID = Date.now().toString()+this.uemail;
      let commentPath = this.state.post.path + '/comments';
      let newComment = {
        'content': this.state.text,
        'username': this.uname,
        'time': Date.now(),
        'email': this.uemail
      };
      database.collection(commentPath).doc(commentID).set(newComment);
      this.setState({
        documentData: [...this.state.documentData, {
                                                    'content': this.state.text,
                                                    'username': this.uname,
                                                    'time': Date.now(),
                                                    'path': commentPath+'/'+commentID,
                                                    'email': this.uemail
                                                   }],
        text: '',
      });
    }
    catch(error) {
      // console.log(error);
    }
  }
  showAlert = (comment) => {
    Alert.alert(
      '',
      'Do you want to delete the comment?',
      [
        {
          text: 'NO',
          onPress: () => console.log('NO Pressed'),
          style: 'cancel',
        },
        {text: 'YES', onPress: () => this.deleteComment(comment)},
      ],
      {cancelable: false},
    );
  }
  differentUser = () => {
    // console.log("Not authorised");
  }
  deleteComment = (comment) => {
    try {
      // console.log("deleting comment...");
      let commentPath = this.state.post.path + '/comments';
      let id = comment.path.replace((commentPath + '/'), '');
      database.collection(commentPath).doc(id).delete();
      documentData = this.state.documentData;
      documentData.splice( documentData.indexOf(comment), 1 );
      this.setState({
        documentData: documentData,
      });
    }
    catch(error) {
      // console.log(error);
    }
  }
  Item = ( comment ) => {
    let date = new Date(comment.time);
    return (
      <TouchableWithoutFeedback onLongPress={() => comment.email==this.uemail ? this.showAlert(comment) : this.differentUser(comment)}>
        <View style={{ backgroundColor: '#d7aefc', borderRadius: 8, height: 'auto', margin: 4 }}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 12, marginLeft: 8, color: '#673BB7' }}>{comment.username}</Text>
            <Text style={{ fontSize: 12, marginLeft: 8, marginRight: 8, color: '#673BB7' }}>{ this.dateFormatting2(date.toString()) }</Text>
          </View>
          <Hyperlink linkDefault={ true } linkStyle={{ color: '#2980b9', fontSize: 16 }}>
          <Text style={{ fontSize: 16, marginLeft: 8, marginRight: 8, color: '#290963' }}>{comment.content}</Text>
          </Hyperlink>
        </View>
      </TouchableWithoutFeedback>
    );
  }
  render() {
    let date = new Date(this.state.post.miliTime);
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection:'row', backgroundColor: '#512DA7', justifyContent: 'space-between' }}>
          <View style={{ flexDirection:'row' }}>
            <Entypo name="arrow-long-left" style={{ color: 'white', margin: 8, fontSize: 25 }} onPress={() => this.props.navigation.goBack()}/>
            <View style={{ flexDirection:'column' }}>
              <Text style={{ color: 'white', fontSize: 16 }}>{ this.state.post.Title }</Text>
              <Text style={{ fontSize: 12 , color: 'white' }}>{ this.dateFormatting(date.toString()) }</Text>
            </View>
          </View>
          <View style={{ margin: 8 }}>
            { 
              !this.state.loading &&
              <FontAwesome name="refresh" style={{ color: 'white', fontSize: 25 }} onPress={() => this.handleRefresh()}/>
            }
            {
              this.state.loading &&
              <ActivityIndicator color="white" />
            }
          </View>
        </View>
        <ScrollView>
        <SkeletonContent
          containerStyle={{ width: this.screenWidth }}
          isLoading={this.state.loading}
          layout={[
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
            { width: this.screenWidth-20, height: 30, borderRadius: 10, marginTop: 6, marginLeft: 10, marginRight: 10 },
          ]}
        >
          <FlatList
            data={this.state.documentData}
            extraData={this.state}
            renderItem={({ item }) => this.Item(item)}
            keyExtractor={(item, index) => String(index)}
            ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No comments</Text>}
            showsVerticalScrollIndicator={true}
            style={{ marginBottom: 80+this.state.bottomMargin }}
          />
        </SkeletonContent>
        </ScrollView>
        <View style={{ position:'absolute', bottom: this.state.bottomMargin, left: 0, right: 0, flexDirection: 'row', backgroundColor: 'white' }}>
          <TextInput
            style={{ height: 'auto', maxHeight: 120, width: this.screenWidth-39, backgroundColor: '#d7aefc', borderRadius: 4, margin: 3, paddingLeft: 5 }}
            placeholder="Join the discussion!"
            placeholderTextColor='#ddcced'
            selectionColor='#8e3fd9'
            onChangeText={(text) => this.setState({text})}
            value={this.state.text}
            multiline
          />
          <TouchableOpacity onPress={() => this.submitComment()}>
            <Entypo name="arrow-with-circle-up" style={{ fontSize: 30, color: '#d7aefc', marginRight: 3 }}/>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

export default comments;
