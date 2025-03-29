import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Contacts: undefined;
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