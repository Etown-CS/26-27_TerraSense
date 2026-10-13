import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoginFieldProps = {
    value: string;
    text: string;
    onChangeText: (text: string) => void;
    passwordVisibility?: {
        visible: boolean;
        toggle: () => void;
    };
};

const LoginField = ({
                      value,
                      text,
                      onChangeText, 
                      passwordVisibility
                    }: LoginFieldProps) => {
    const theme = useTheme();
    const isPasswordVisible = passwordVisibility?.visible ?? false;

    return(
    <View style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={text}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={passwordVisibility !== undefined && !isPasswordVisible}
        />
        {passwordVisibility && (
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                onPress={passwordVisibility.toggle}
                style={styles.toggle}>
                <SymbolView
                    name={isPasswordVisible
                        ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                        : { ios: 'eye', android: 'visibility', web: 'visibility' }}
                    size={20}
                    tintColor={theme.textSecondary}
                />
            </TouchableOpacity>
        )}
    </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingLeft: Spacing.three,
        paddingRight: Spacing.two,
    },
    input: {
        flex: 1,
        minWidth: 0,
        paddingVertical: Spacing.three,
        fontSize: 16,
    },
    toggle: {
        minWidth: 40,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default LoginField;