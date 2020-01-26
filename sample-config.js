import firebase from 'firebase';
import '@firebase/firestore';

export const firebaseConfig = {
	//your project config 
};

firebase.initializeApp(firebaseConfig);

export const fbase = firebase;
export const firestore = firebase.firestore();
export const auth = firebase.auth();

//make a copy of this file by name "config.js"
