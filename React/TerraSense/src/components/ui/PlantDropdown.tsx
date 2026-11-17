import { Dropdown } from 'react-native-element-dropdown';
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";

function PlantDropdown({style, pStyle, stStyle, inStyle, iStyle, value, onChange}: {
    style?: StyleProp<ViewStyle>
    pStyle?: StyleProp<TextStyle>
    stStyle?: StyleProp<TextStyle>
    inStyle?: StyleProp<TextStyle>
    iStyle?: StyleProp<ImageStyle>
    value: string | null
    onChange: (value: string) => void
    }) {

    // Sample data for the dropdown, change to fetch from database or props as needed
    const data = [
        { label: 'Node 1', value: '1' },
        { label: 'Node 2', value: '2' },
        { label: 'Node 3', value: '3' },
        { label: 'Node 4', value: '4' },
        { label: 'Node 5', value: '5' },
        { label: 'Node 6', value: '6' },
        { label: 'Node 7', value: '7' },
        { label: 'Node 8', value: '8' },
    ];

    return (
        <Dropdown
            style={style}
            placeholderStyle={pStyle}
            selectedTextStyle={stStyle}
            inputSearchStyle={inStyle}
            iconStyle={iStyle}
            data={data}
            labelField="label"
            valueField="value"
            placeholder="Select a node"
            value={value}
            onChange={item => {
                onChange(item.value);
            }}
        >

        </Dropdown>

    );
}

export default PlantDropdown;
