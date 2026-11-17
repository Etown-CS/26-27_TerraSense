import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';

import {auth, db} from '@/lib/firebase';
import { doc, setDoc } from '@firebase/firestore';
import {createUserWithEmailAndPassword} from 'firebase/auth';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import LoginField from '@/components/ui/LoginField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Button from '@/components/ui/button';


export default function Signup() {
        const router = useRouter();
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [showPassword, setShowPassword] = useState(false);
        const [showConfirmPassword, setShowConfirmPassword] = useState(false);
        const toggleShowPassword = () => {setShowPassword(current => !current);};
        const toggleShowConfirmPassword = () => {setShowConfirmPassword(current => !current);};

      const handleSignUp = async () => {
        const normalizedEmail = email.trim();
        if(!normalizedEmail || !password || !confirmPassword) {
          Alert.alert('Error', 'Please fill in all fields to sign-up.')
        } else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.')
        } else if(password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match.')
        } else if(password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
          Alert.alert('Invalid Input', `Please enter a valid password to signup. 
                        \n\nPassword must be at least 8 characters long and include:
                        \n   • An uppercase letter
                        \n   • A special character
                        \n   • A number (0 - 9)`)
        } else {
          try{
            const userCredentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            const userID = userCredentials.user.uid;
            await setDoc(doc(db, 'users', userID), {
              email: normalizedEmail,
              password: password,
              createdAt: new Date().toISOString(),
              userID: userID,
            });
            Alert.alert('Success', 'Account created successfully.')
            router.push('/login');
          } catch (error) {
            console.error('Error creating account:', error);
            const message = error instanceof Error && error.message.includes('auth/invalid-email')
              ? 'Please enter a valid email address.'
              : 'An error occurred while creating the account. Please try again.';
            Alert.alert('Error', message);
          }
        }

      }



    return (
        <ThemedView style={styles.container}>
         <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.heroSection}>
        
            <ThemedText type="title" style={styles.title}>Sign-Up</ThemedText>
            <LoginField
                value={email}
                text="Email address"
                onChangeText={setEmail}
            />
            <LoginField
                value={password}
                text="Set Password"
                onChangeText={setPassword}
                passwordVisibility={{
                    visible: showPassword,
                    toggle: toggleShowPassword,
                }}
            />

            <LoginField
                value={confirmPassword}
                text="Confirm Password"
                onChangeText={setConfirmPassword}
                passwordVisibility={{
                    visible: showConfirmPassword,
                    toggle: toggleShowConfirmPassword,
                }}
            />

            <Button title='Sign Up' onPress={handleSignUp} />

            <ThemedView style={styles.accountPrompt}>
              <ThemedText type="small" style={styles.accountText}>Already have an account?</ThemedText>
              <Link href="/login" asChild>
                <ThemedText type="linkPrimary">Login instead!</ThemedText>
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
