import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawerNavigationProp, DrawerContentComponentProps } from '@react-navigation/drawer'
import { useDispatch, useSelector } from 'react-redux'
import * as AsyncStore from '../AsyncStore'
import { clearUserData } from '../Redux/slices/loginSlice'
import { Shield, ShieldOff } from 'lucide-react-native'


interface MenuItem {
  id: string
  label: string
  url: string
}

const SideMenu: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  const [loader, setLoader] = useState(false)
  const insets = useSafeAreaInsets()
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const dispatch = useDispatch()

  useEffect(() => {
    LocalStorageaData();
  }, [])
  const selector = useSelector((state: any) => state?.login);
  

  const handleMenuItemPress = (url: string) => {
    Linking.openURL(url);
    navigation.closeDrawer()
  }

  const handleSignOut = async () => {

    await AsyncStore.storeData(AsyncStore.Keys.USER_TOKEN, '');
    await AsyncStore.storeData(AsyncStore.Keys.USER_DATA, '');
    await AsyncStore.storeData(AsyncStore.Keys.IS_VERIFIED, '');
    await AsyncStore.storeData(AsyncStore.Keys.USER_ID, '');
    await AsyncStore.storeData(AsyncStore.Keys.ROLE, '');
    await AsyncStore.storeData(AsyncStore.Keys.EMP_ID, '');
    await AsyncStore.storeData(AsyncStore.Keys.ORG_ID, '');
    await AsyncStore.storeData(AsyncStore.Keys.IS_LOGIN, 'false');
    navigation.closeDrawer();

  }

  //get user data from async storage and set it to state
  const LocalStorageaData = async () => {
    try {
      const userLoggedInData = await AsyncStore.getData(AsyncStore?.Keys?.USER_DATA);
      const userRole = await AsyncStore.getData(AsyncStore?.Keys?.ROLE);
      const verify = await AsyncStore.getData(AsyncStore?.Keys?.IS_VERIFIED);
      setIsVerified(verify === 'true');
      if (userLoggedInData) {
        const parsedUserData = JSON.parse(userLoggedInData);
        setUserName(parsedUserData?.user_metadata?.full_name || null);
        setEmail(parsedUserData?.email || null)
      }
      if (userRole) {
        setRole(userRole);
      }
    } catch (error) {
      console.log("Error fetching user data from AsyncStorage:", error);
    }
  }

  return (
    <ScrollView style={[styles.menuPanel, { paddingTop: insets.top + 16 }]} scrollEnabled={false}>
      {/* Header */}
      <View style={styles.menuHeader}>
        <Text style={styles.menuTitle}>Menu</Text>
      </View>

      {/* User Profile Section */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{email ? email.charAt(0).toUpperCase() : 'IH'}</Text>
        </View>
        <View style={styles.userInfo}>
          {role !== 'employer' &&
            <Text style={styles.userName}>{userName}</Text>
          }
          <Text style={styles.userEmail}>{email}</Text>
          {
            role !== 'employer' ? (
              <View style={styles.userStatusContainer}>
                {isVerified ? (
                  <Shield color={'#00A746'} size={16} />
                ) : (
                  <ShieldOff color={'#FF2434'} size={16} />
                )}
                <Text style={isVerified ? styles.userStatus : styles.userStatusNotVerified}>
                  {isVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            ) : null
          }

        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItemsContainer}>
        
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutIcon}>➤</Text>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default SideMenu

const styles = StyleSheet.create({
  menuPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  menuHeader: {
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#165DFC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginBottom: 4,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatus: {
    fontSize: 12,
    color: '#00A746',
    fontFamily: 'Poppins-Regular',
  },
  userStatusNotVerified: {
    fontSize: 12,
    color: '#FF2434',
    fontFamily: 'Poppins-Regular',
  },
  menuItemsContainer: {
    gap: 12,
    marginBottom: 'auto',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  menuItemText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  signOutContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 'auto',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF2434',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  signOutIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
  },
  signOutText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
})
