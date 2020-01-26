import * as React from 'react';
import { ScrollView, Image, View, Alert, Dimensions, Text, TouchableWithoutFeedback, TouchableNativeFeedback, ActivityIndicator, FlatList, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { DrawerActions } from 'react-navigation-drawer';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Sae } from 'react-native-textinput-effects';
import * as ImageManipulator from 'expo-image-manipulator';
import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';

import { fbase, firestore } from '../../config';
import { userINFO } from '../LoadingScreen';

export default class createEvent extends React.Component {
  constructor(props) {
    super(props);
    this.screenWidth = (Dimensions.get('window').width);
    this.state = {
      title: '',
      desc: '',
			image: null,
			imageHeight: 0,
			imageWidth: 0,
      date: new Date(),
      mode: 'date',
      show: false,
      textinputheight: 0,
      posting: false,
      posted: false,
      documentData: null,
			loading: false,
			bottomMargin: 0,
    };
  }
  
  retrieveData = async () => {
    try {
      this.setState({ loading: true });
      let initialQuery = await firestore.collection('Posts')
        .where('uploaded_by', 'array-contains', userINFO.email)
        .orderBy('miliTime')
      let documentSnapshots = await initialQuery.get();
      let documentData = documentSnapshots.docs.map(document => Object.assign(document.data(), {"path": document.ref.path}));
      this.setState({
        documentData: documentData,
        loading: false,
      });
    }
    catch (error) {
      console.log(error);
      this.setState({loading: false});
    }
  };

  componentDidMount() {
    this.getPermissionAsync();
    // this.retrieveData();
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }
  componentWillUnmount = () => {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }
  _keyboardDidShow = (e) => {
    this.setState({
      bottomMargin: e.endCoordinates.height
    });
  }
  _keyboardDidHide = () => {
    this.setState({
      bottomMargin: 0
    });
  }

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  }

  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true
    });
    // console.log(result);
    if (!result.cancelled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.uri,
        [],
        { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG }
      );
      // console.log(manipResult);
      console.log(Image.getSize(manipResult.uri));
      
      this.setState({
				image: manipResult.uri,
				imageHeight: manipResult.height,
				imageWidth: manipResult.width,
			});
    }
  };
  
  setDate = (event, date) => {
    if(date == null) return;
    if(this.state.mode=='date') {
      let datenew = date.toDateString();
      let timeold = this.state.date.toTimeString();
      date = new Date(datenew + ' ' + timeold);
    }
    else if(this.state.mode=='time') {
      let dateold = this.state.date.toDateString();
      let timenew = date.toTimeString();
      date = new Date(dateold + ' ' + timenew);
    }
    this.setState({
      show: Platform.OS === 'ios' ? true : false,
      date,
    });
  }
  show = mode => {
    this.setState({
      show: true,
      mode,
    });
  }
  datepicker = () => {
    this.show('date');
  }
  timepicker = () => {
    this.show('time');
  }
  dateFormating = (date) => {
    let d = date.split(" ");
    return ( d[2] + ' ' + d[1] + ' ' + d[3] );
  }
  timeFormating = (date) => {
    let d = date.split(" ");
    return ( d[4].slice(0, 5) );
  }
  post = async() => {
    console.log(userINFO.displayName);
    if( this.state.title=='' || this.state.desc=='') {
      Alert.alert("fill all the details.");
      return;
    }
    this.setState({ posting: true });
    try {
      let ID = userINFO.email + Date.now().toString();
      if(this.state.image!=null) {
        const response = await fetch(this.state.image);
        const blob = await response.blob();
        let ref = fbase.storage().ref().child("postImages/"+ID+'.jpg');
        const snapshot = await ref.put(blob);
        blob.close();
        let image_url = await snapshot.ref.getDownloadURL();
        let newPost = {
          'Title': this.state.title,
          'desc': this.state.desc,
					'image_url': image_url,
					'image_height': this.state.imageHeight,
					'image_width': this.state.imageWidth,
          'miliTime': this.state.date.getTime(),
          'uploaded_by': [ userINFO.email, userINFO.uid, userINFO.displayName ],
          'user_image': userINFO.photoURL
        };
        firestore.collection('Posts').doc(ID).set(newPost);
      }
      else {
        let newPost = {
          'Title': this.state.title,
          'desc': this.state.desc,
          'miliTime': this.state.date.getTime(),
          'uploaded_by': [ userINFO.email, userINFO.uid, userINFO.displayName ],
          'user_image': userINFO.photoURL
        };
        firestore.collection('Posts').doc(ID).set(newPost);
      }
      this.setState({
        title: '',
        desc: '',
        image: null,
        date: new Date(),
        textinputheight: 32.5,
      });
      this.setState({ posted: true });
      setTimeout(() => {
        this.setState({ posted: false });
      }, 3000);
    }
    catch(error) {
      console.log(error);
    }
    this.setState({ posting: false });
  }
  render() {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ backgroundColor: '#512DA7', height: 45, flexDirection: 'row' }}>
          <Entypo name="menu" style={{ fontSize: 30, color: 'white', marginLeft: 10, marginTop: 8 }} onPress={() => this.props.navigation.dispatch(DrawerActions.toggleDrawer())} />
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 8, marginLeft: 50 }}>Create New Event</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps={'always'} style={{ padding: 10, backgroundColor: '#cc9ce6', paddingBottom: 20, marginBottom: this.state.bottomMargin }}>
          <View style={{ padding: 10, backgroundColor: 'rgba(246, 245, 247, 0.8)', borderRadius: 20 }}>
            <Sae
                label={'Title'}
                iconClass={FontAwesomeIcon}
                iconName={'pencil'}
                iconColor={'#3d0859'}
                inputPadding={16}
                labelHeight={24}
                borderHeight={2}
                inputStyle={{ color: '#3d0859' }}
                selectionColor={'#ca84f0'}
                autoCapitalize={'none'}
                autoCorrect={false}
                onChangeText={(title) => { this.setState({title}) }}
                value={this.state.title}
              />
              <Sae
                label={'Description'}
                iconClass={FontAwesomeIcon}
                iconName={'pencil'}
                iconColor={'#3d0859'}
                inputPadding={16}
                labelHeight={Math.max(15, this.state.textinputheight-20)}
                height={Math.max(32.5, this.state.textinputheight)}
                borderHeight={2}
                multiline
                inputStyle={{ color: '#3d0859' }}
                style={{ marginTop: 20 }}
                selectionColor={'#ca84f0'}
                autoCapitalize={'none'}
                autoCorrect={false}
                onChangeText={(desc) => { this.setState({desc}) }}
                onContentSizeChange={(event) => {
                  this.setState({textinputheight: event.nativeEvent.contentSize.height});
                }}
                value={this.state.desc}
              />
              <View style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5, color: '#7773AD' }}>Image</Text>
                { !this.state.image &&
                <TouchableWithoutFeedback onPress={this._pickImage}>
                  <FontAwesome name='image' style={{fontSize: 200, color: '#ac84f5'}}/>
                </TouchableWithoutFeedback>
                }
                { this.state.image    && 
                <TouchableWithoutFeedback onPress={this._pickImage}>
                  <Image source={{ uri: this.state.image }} style={{ width: this.screenWidth-20, height: this.state.imageHeight*(this.screenWidth-20)/this.state.imageWidth }} resizeMode='contain' />
                </TouchableWithoutFeedback>
                }
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 5, marginTop: 5, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5, color: '#7773AD' }}>The Event is being held on </Text>
                <View style={{ borderBottomColor: '#7a4099', borderBottomWidth: 2 }}>
                <TouchableWithoutFeedback onPress={this.datepicker}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#7773AD', marginTop: 3 }}>{ this.dateFormating(this.state.date.toString()) }</Text>
                </TouchableWithoutFeedback>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5, color: '#7773AD' }}> at </Text>
                <View style={{ borderBottomColor: '#7a4099', borderBottomWidth: 2 }}>
                <TouchableWithoutFeedback onPress={this.timepicker}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#7773AD', marginTop: 3 }}>{ this.timeFormating(this.state.date.toString()) }</Text>
                </TouchableWithoutFeedback>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5, color: '#7773AD' }}>.</Text>
              </View>
              { this.state.show && 
                <DateTimePicker
                  value={this.state.date}
                  mode={this.state.mode}
                  is24Hour={true}
                  display="default"
                  onChange={this.setDate} />
              }
            <View style={{ margin: 10 }}>
              { Platform.OS === 'android' && !this.state.posted && !this.state.posting &&
                <TouchableNativeFeedback onPress={() => this.post()} background={TouchableNativeFeedback.SelectableBackground()}>
                  <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#ac84f5', borderRadius: 5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 25, color: '#3d0859' }}>Post</Text>
                  </View>
                </TouchableNativeFeedback>
              }
              { Platform.OS === 'ios' && !this.state.posted && !this.state.posting &&
                <TouchableWithoutFeedback onPress={() => this.post()} background={TouchableNativeFeedback.SelectableBackground()}>
                  <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#ac84f5', borderRadius: 5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 25, color: '#3d0859' }}>Post</Text>
                  </View>
                </TouchableWithoutFeedback>
              }
              { this.state.posted && !this.state.posting &&
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#ac84f5', borderRadius: 5 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 25, color: '#3d0859' }}>Event posted</Text>
                </View>
              }
              { !this.state.posted && this.state.posting &&
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#ac84f5', flexDirection: 'row', justifyContent: 'space-around', borderRadius: 5 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 25, color: '#3d0859' }}>posting</Text>
                  <ActivityIndicator size="small" color="#3d0859" />
                </View>
              }
            </View>
          </View>
          <View style={{ padding: 10, marginTop: 10, backgroundColor: 'rgba(246, 245, 247, 0.8)', borderRadius: 20 }}>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 25, color: '#3d0859' }}>Events posted by you</Text>
              { !this.state.loading && <FontAwesome name="refresh" style={{fontSize: 35, color: '#3d0859'}} onPress={() => this.retrieveData()}/>}
              { this.state.loading && <ActivityIndicator size="large" color="#3d0859" />}
            </View>
            { this.state.documentData!=null &&
              <FlatList
                data={this.state.documentData}
                extraData={this.state}
                renderItem={({ item }) => this.Item(item)}
                keyExtractor={(item, index) => String(index)}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>You haven't posted anything yet.</Text>}
              />
            }
          </View>
          <Text> </Text>
          <Text> </Text>
          <Text> </Text>
        </ScrollView>
      </View>
    );
  }
  Item = ( post ) => {
    return (
      <View>
        <View style={{ backgroundColor: '#d7aefc', borderRadius: 4, margin: 4, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', padding: 5 }}>
          <Text style={{ fontSize: 16, color: '#3d0859' }}>{ post.Title }</Text>
          <MaterialIcons name='delete' style={{ fontSize: 20 }} onPress={() => this.showAlert( post )} />
        </View>
      </View>
    );
  }
  
  showAlert = (post) => {
    Alert.alert(
      '',
      'Do you want to delete the post?',
      [
        {
          text: 'NO',
          onPress: () => console.log('NO Pressed'),
          style: 'cancel',
        },
        {text: 'YES', onPress: () => this.deletePost(post)},
      ]
    );
  }

  deletePost = ( post ) => {
    try {
      let id = post.path.replace(('Posts/'), '');
			firestore.collection('Posts').doc(id).delete();
			var ref = fbase.storage().ref().child("postImages/"+id+'.jpg');
			ref.delete().then(function() {
				// console.log("file deleted!");
			}).catch(function(error) {
				// console.log("error in deleting file!");
			});
      let documentData = this.state.documentData;
      documentData.splice( documentData.indexOf(post), 1 );
      this.setState({
        documentData: documentData,
      });
    }
    catch(error) {
      console.log(error);
    }
  }
}
