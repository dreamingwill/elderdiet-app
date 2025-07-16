import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface UserAvatarProps {
  avatar?: string | null;
  name: string;
  size?: number;
  showBorder?: boolean;
}

export default function UserAvatar({ 
  avatar, 
  name, 
  size = 40, 
  showBorder = false 
}: UserAvatarProps) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: showBorder ? 2 : 0,
    borderColor: '#4CAF50',
  };

  const textStyle = {
    fontSize: size * 0.4,
    fontWeight: 'bold' as const,
    color: '#fff',
  };

  return (
    <View style={[styles.avatar, avatarStyle]}>
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
}); 