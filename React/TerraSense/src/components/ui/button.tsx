import {Pressable, StyleSheet, Text} from 'react-native';
import type { StyleProp, ViewStyle } from "react-native";

function Button({
    title,
    onPress,
    style
}: {
    title: string;
    onPress: () => void
    style?: StyleProp<ViewStyle>
}) {

  return (
    <Pressable style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export default Button;

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});