import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Contacts: undefined;
  Social: undefined;
  Profile: undefined;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
  ContactDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
}; 