import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useState } from 'react';

import LoginField from '@/components/ui/LoginField';



export default function Signup() {
        const [username, setUsername] = useState("");
        const [password, setPassword] = useState("");
        const [showPassword, setShowPassword] = useState(false);
        const toggleShowPassword = () => {setShowPassword(current => !current);};


    return (
        <ThemedView style={styles.container}>
         <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.heroSection}>
        
            <ThemedText type="title">Sign-Up</ThemedText>
            <LoginField
                value={username}
                text="Set Username"
                onChangeText={setUsername}
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
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
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

});
