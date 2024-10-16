import * as firebase from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    // firebase configuration
};

// Initialize Firebase app and get a reference to the database
const app = firebase.initializeApp(firebaseConfig);
export const database = getDatabase(app);
