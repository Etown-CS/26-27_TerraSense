import { Alert, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import LoginField from '@/components/ui/LoginField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Button from '@/components/ui/button';

export default function Login() {
        const router = useRouter();
        const [username, setUsername] = useState("");
        const [password, setPassword] = useState("");
        const [showPassword, setShowPassword] = useState(false);
        const toggleShowPassword = () => {setShowPassword(current => !current);};

        const authenticate = async (username, password) => {
          // Implement authentication logic here
          return true;
        }

        const handleLogin = async () => {
          if(username && password) {
            const result = await authenticate(username, password);
            if(result){
              router.push('/');
            }
          } else if(!username || !password) {
            Alert.alert('Error', 'Please fill in all fields to login.')
          } else {
            Alert.alert('Error', 'Invalid username or password. Please try again.')
          }
          
        }

    return (
        <ThemedView style={styles.container}>
         <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.heroSection}>
        
            <ThemedText type="title" style={styles.title}>Login</ThemedText>
            <LoginField
                value={username}
                text="Enter Username"
                onChangeText={setUsername}
            />
            <LoginField
                value={password}
                text="Enter Password"
                onChangeText={setPassword}
                passwordVisibility={{
                    visible: showPassword,
                    toggle: toggleShowPassword,
                }}
            />

            <Button title='Login' onPress={handleLogin} />

            <ThemedView style={styles.accountPrompt}>
              <ThemedText type="small" style={styles.accountText}>Don't have an account?</ThemedText>
                <Link href="/signup" asChild>
                  <ThemedText type="linkPrimary">Sign up here!</ThemedText>
                </Link>
            </ThemedView>
            
            </ThemedView>
         </SafeAreaView>
        </ThemedView>
    );

}

const styles = StyleSheet.create({
container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: 200,
    gap: Spacing.four,
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  title: {
    textAlign: 'center',
    paddingBottom: Spacing.five,
  },
  accountText: {
    textAlign: 'center',
  },
  accountPrompt: {
    alignItems: 'center',
  },

});