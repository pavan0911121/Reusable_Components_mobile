import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
// import SkeletonLoading from 'react-native-skeleton-loading';

interface SkeletonLoaderProps {
  isLoading: boolean;
  width?: number;
  height?: number;
  children?: ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  highlightColor?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  isLoading,
  width = 100,
  height = 100,
  children,
  style,
  backgroundColor = '#ADADAD',
  highlightColor = '#FFFFFF',
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <View>
      <Text>Loading...</Text>
    </View>
    // <SkeletonLoading background={backgroundColor} highlight={highlightColor}>
    //   <View style={[styles.container, style]}>
    //     <View
    //       style={[
    //         styles.thumbnail,
    //         { width, height, backgroundColor },
    //       ]}
    //     />
    //     <View style={styles.details}>
    //       <View style={[styles.title, { backgroundColor }]} />
    //       <View style={[styles.subtitle, { backgroundColor }]} />
    //       <View style={[styles.meta, { backgroundColor }]} />
    //     </View>
    //   </View>
    // </SkeletonLoading>
  );
};

export default SkeletonLoader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thumbnail: {
    borderRadius: 10,
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    width: '50%',
    height: 10,
    marginBottom: 3,
    borderRadius: 5,
  },
  subtitle: {
    width: '20%',
    height: 8,
    borderRadius: 5,
  },
  meta: {
    width: '15%',
    height: 8,
    marginTop: 3,
    borderRadius: 5,
  },
});