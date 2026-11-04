import { Text, TouchableOpacity } from 'react-native';
import { styles, colors } from '../styles';

// Reusable chunky 3D button.
export default function DuolingoButton({ title, onPress, disabled, color = colors.green, shadow = colors.greenDark }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: disabled ? colors.grey : color, borderBottomColor: disabled ? colors.greyDark : shadow }]}
    >
      <Text style={[styles.btnText, disabled && { color: colors.greyDark }]}>{title}</Text>
    </TouchableOpacity>
  );
}
