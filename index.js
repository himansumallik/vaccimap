import { registerRootComponent } from 'expo';

import DashboardScreen from './screens/DashboardScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import LoginScreen from './screens/LoginScreen';


// registerRootComponent calls AppRegistry.registerComponent('main', () => DashboardScreen);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(DashboardScreen);
