import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withSpring,
  interpolate,
  Easing
} from 'react-native-reanimated';

interface SimpleFormModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
  fullScreen?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const SimpleFormModal: React.FC<SimpleFormModalProps> = ({
  visible,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  fullScreen = false,
}) => {
  const backdropOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(1000);
  const modalScale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show animations
      backdropOpacity.value = withTiming(1, { 
        duration: 300,
        easing: Easing.out(Easing.cubic)
      });
      modalTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      modalScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      contentOpacity.value = withTiming(1, { 
        duration: 400,
        easing: Easing.out(Easing.cubic)
      });
    } else {
      // Hide animations
      backdropOpacity.value = withTiming(0, { duration: 250 });
      modalTranslateY.value = withTiming(1000, { 
        duration: 300,
        easing: Easing.in(Easing.cubic)
      });
      modalScale.value = withTiming(0.9, { duration: 250 });
      contentOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
      backgroundColor: `rgba(0, 0, 0, ${interpolate(backdropOpacity.value, [0, 1], [0, 0.5])})`,
    };
  });

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: modalTranslateY.value },
        { scale: modalScale.value }
      ],
      opacity: contentOpacity.value,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        { translateY: interpolate(contentOpacity.value, [0, 1], [20, 0]) }
      ],
    };
  });

  const handleBackdropPress = () => {
    onClose();
  };

  const sizeStyles = {
    sm: { paddingTop: 20, paddingBottom: 40 },
    md: { paddingTop: 24, paddingBottom: 60 },
    lg: { paddingTop: 32, paddingBottom: 80 }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1">
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Animated Backdrop */}
        <AnimatedView 
          className="absolute inset-0"
          style={backdropAnimatedStyle}
        >
          <TouchableOpacity 
            className="flex-1"
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </AnimatedView>

        {/* Modal Container */}
        <View className={fullScreen ? "flex-1" : "flex-1 justify-end"}>
          <AnimatedView 
            className={fullScreen ? "bg-white flex-1" : "bg-white rounded-t-3xl shadow-2xl"}
            style={[
              modalAnimatedStyle,
              fullScreen ? {
                flex: 1,
              } : { 
                minHeight: '40%',
                maxHeight: '95%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 20,
              }
            ]}
          >
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              {fullScreen ? (
                <SafeAreaView className="flex-1">
                  {/* Header for full screen */}
                  <View className="flex-row items-center justify-between px-6 py-6 border-b border-gray-100">
                    {title && (
                      <Text className="text-xl font-bold text-gray-900 flex-1">
                        {title}
                      </Text>
                    )}
                    
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center ml-4"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={22} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Content */}
                  <ScrollView
                className="flex-1"
                contentContainerStyle={sizeStyles[size]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={true}
                scrollEventThrottle={16}
                nestedScrollEnabled={true}
              >
                <Animated.View 
                  className="px-6"
                  style={contentAnimatedStyle}
                >
                  {children || (
                    <View className="flex-1 justify-center items-center py-12">
                      <Text className="text-gray-500 text-center text-lg">
                        No content provided
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </ScrollView>
                </SafeAreaView>
              ) : (
                <>
                  {/* Handle Bar - Only show for bottom sheet */}
                  <View className="items-center pt-3 pb-2">
                    <View className="w-12 h-1 bg-gray-300 rounded-full" />
                  </View>

                  {/* Header */}
                  <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                    {title && (
                      <Text className="text-xl font-bold text-gray-900 flex-1">
                        {title}
                      </Text>
                    )}
                    
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center ml-4"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name="close" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Content */}
                  <ScrollView
                    className="flex-1"
                    contentContainerStyle={sizeStyles[size]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    scrollEventThrottle={16}
                    nestedScrollEnabled={true}
                  >
                    <Animated.View 
                      className="px-6"
                      style={contentAnimatedStyle}
                    >
                      {children || (
                        <View className="flex-1 justify-center items-center py-12">
                          <Text className="text-gray-500 text-center text-lg">
                            No content provided
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  </ScrollView>
                </>
              )}
            </KeyboardAvoidingView>
          </AnimatedView>
        </View>
      </View>
    </Modal>
  );
};